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
        
        #join room group
        await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)
        
        await self.accept()

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
            print(f"Missing key in message payload: {e}")
        except json.JSONDecodeError as e:
            # log or handle JSON decoding error
            print(f"Invalid JSON received: {e}")
        
        
    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            self.username = text_data_json.get('username', 'Anonymous')
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
        self.receiver_nickname = self.scope['url_route']['kwargs']['receiver']
        self.sender_nickname = self.scope['url_route']['kwargs']['sender']
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
            print(f"some errro from get_user_profile function: {nickname}")
            return None
        except AttributeError:
            print("User is not authenticated")
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

