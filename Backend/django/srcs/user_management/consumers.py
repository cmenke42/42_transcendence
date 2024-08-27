import json
from channels.generic.websocket import AsyncWebsocketConsumer, WebsocketConsumer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from channels.generic.websocket import SyncConsumer
from chat.models import PrivateChatMessage
from user_profile.models import UserProfile
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from users.models import CustomUser
from rest_framework.authtoken.models import Token
import datetime

import logging

logger = logging.getLogger(__name__)

channel_layer = get_channel_layer()

# class ChatConsumer(WebsocketConsumer):
class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        # self.room_group_name = 'chat_%s' % self.room_name
        self.room_group_name = f'chat_{self.room_name}'

        user = self.scope['user']
        if user.is_authenticated:
            #join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()
        else:
            await self.close()
        
        # await self.accept()

    async def disconnect(self, close_code):
        try:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            
            #notify group about the user disconnection
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'username': f'{self.username}',
                    'message': ' has left the chat.'
                }
            )
        except KeyError as e:
            # log or handle missing keys
            logger.info(f"Missing key in message payload: {e}")
        except json.JSONDecodeError as e:
            # log or handle JSON decoding error
            logger.info(f"Invalid JSON received: {e}")
        
        
    async def receive(self, text_data):
        try:
            try:
                text_data_json = json.loads(text_data)
            except json.JSONDecodeError as e:
                logger.info(f"Invalid JSON received: {e}")
                return
            # text_data_json = json.loads(text_data)
            self.username = text_data_json.get('username', 'System')
            # username = text_data_json['username']
            message = text_data_json.get('message')

            # Log received message
            # logger.debug(f"Received message: {message}")

            # Broadcast message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'username': self.username,
                    # 'username' : username
                    'message': message
                }
            )
        except json.JSONDecodeError:
            # logger.error(f"Invalid JSON received: {text_data}")
            pass

    async def chat_message(self, event):
        username = event['username']
        message = event['message']
        await self.send(text_data=json.dumps({
            'username': username,
            'message': message
        }))
        

#private message
class PrivateChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if not self.user.is_authenticated:
            await self.close()
            return
        self.receiver_nickname = self.scope['url_route']['kwargs']['receiver']
        self.sender_nickname = self.scope['url_route']['kwargs']['sender']
        #Ensure that nickname matches the authenticated user's nickname
        # if self.user.nickname != self.sender_nickname:
        #     await self.close()
        #     return
        self.sender_profile = await self.get_user_profile(self.sender_nickname)
        self.receiver_profile = await self.get_user_profile(self.receiver_nickname)
        if self.sender_profile is None or self.receiver_profile is None:
            await self.close()
            return 
        # else:
            # self.room_name = f'private_chat_{min(self.user.username, self.other_user)}_{max(self.user.username, self.other_user)}'
        self.room_name = await self.get_room_name()
        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.accept()
    
    async def disconnect(self, close_code):
        if self.sender_profile is not None:
            await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']
        chat_message = await self.create_private_chat_message(self.sender_profile.nickname, self.receiver_nickname, message)
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': 'chat_message',
                'message': {
                    'sender': self.sender_profile.nickname,
                    'receiver': self.receiver_nickname,
                    'message': message,
                    'timestamp': str(chat_message.timestamp)
                }
            }
        )
        
    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))
        if event['message']['receiver'] == self.sender_profile.nickname:
            await self.mark_message_as_read(event['message']['sender'], event['message']['receiver'])
    
    @database_sync_to_async
    def get_user_profile(self, nickname):
        try:
            return UserProfile.objects.get(nickname=nickname)
        except UserProfile.DoesNotExist:
            logger.info(f"some errro from get_user_profile function: {nickname}")
            return None
        except AttributeError:
            logger.info("User is not authenticated")
            return None
    
    @database_sync_to_async
    def get_room_name(self):
        if self.sender_profile is None:
            return None
        return f'private_chat_{min(self.sender_profile.nickname, self.receiver_nickname)}_{max(self.sender_profile.nickname, self.receiver_nickname)}'
    
    @database_sync_to_async
    def create_private_chat_message(self, sender_nickname, receiver_nickname, message):
        sender_profile = UserProfile.objects.get(nickname=sender_nickname)
        receiver_profile = UserProfile.objects.get(nickname=receiver_nickname)
        return PrivateChatMessage.objects.create(sender=sender_profile, receiver=receiver_profile, message=message)

    @database_sync_to_async
    def mark_message_as_read(self, sender_nickname, receiver_nickname):
        PrivateChatMessage.objects.filter(sender__nickname= sender_nickname, receiver__nickname=receiver_nickname, is_read=False).update(is_read=True)

class OnlineStatusConsumer(AsyncWebsocketConsumer):
    online_users = set()

    async def connect(self):
        await self.accept()
        logger.info(f"New connection established. Total connections: {len(self.online_users)}")
    
    async def disconnect(self, close_code):
        if hasattr(self, 'username'):
            if self.username in OnlineStatusConsumer.online_users:
                OnlineStatusConsumer.online_users.remove(self.username)
                logger.info(f"User {self.username} disconnected. Remaining users: {OnlineStatusConsumer.online_users}")
                await self.broadcast_online_users()
            else:
                logger.info(f"User {self.username} not found in online_users set.")
        else:
            logger.info("No username attribute found during disconnect.")
        
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        if data['type'] == 'online':
            self.username = data['username']
            OnlineStatusConsumer.online_users.add(self.username)
            logger.info(f"User {self.username} connected. Total users: {OnlineStatusConsumer.online_users}")
            await self.broadcast_online_users()
        elif data['type'] == 'offline':
            OnlineStatusConsumer.online_users.remove(self.username)
            logger.info(f"User {self.username} disconnected. Remaining users: {OnlineStatusConsumer.online_users}")
            await self.broadcast_online_users()
        
    async def broadcast_online_users(self):
        message = {
            'type': 'online_users',
            'online_users': list(OnlineStatusConsumer.online_users)
        }
        logger.info(f"Broadcasted online users: {OnlineStatusConsumer.online_users}")
        await self.send(text_data=json.dumps(message))

# remote player
class GameConsumer(AsyncWebsocketConsumer):
    async def connect (self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'game_{self.room_name}'

        #join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        # await self.accept()
    
    async def disconnect(self, code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        # pass

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data['type']

        if message_type == 'game_start':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_start',
                    'timestamp': data.get('timestamp')
                }
            )
    
        elif message_type == 'game_state_update':
            #send the game state to the other player
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_state_update',
                    'game_state': data['game_state']
                }
            )
        elif message_type == 'game_status_update':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_status_update',
                    'game_status': data['gameStatus'],
                    'timestamp': data.get('timestamp')
                }
            )

    async def game_start(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_start',
            'timestamp': event.get('timestamp')
        }))

    async def game_status_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_status_update',
            'gameStatus': event['game_status'],
            'timestamp': event.get('timestamp')
        }))

    # Receive game state update from the other player
    async def game_state_update(self, event):
        game_state = event['game_state']

        # Send the game state to the player
        await self.send(text_data=json.dumps({
            'type': 'game_state_update',
            'game_state': game_state
        }))