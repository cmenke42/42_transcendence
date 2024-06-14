import json
from channels.generic.websocket import AsyncWebsocketConsumer, WebsocketConsumer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from channels.generic.websocket import SyncConsumer

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
        await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)
    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message = text_data_json.get('message')

            # Log received message
            # logger.debug(f"Received message: {message}")

            # Broadcast message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message
                }
            )
        except json.JSONDecodeError:
            # logger.error(f"Invalid JSON received: {text_data}")
            pass

    async def chat_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
            'message': message
        }))
# class TaskConsumer(SyncConsumer):
# 	def task(self, message):
#        #long-running or asynchronous task 
# 		return 'Task Complete!'

# async def receive(self, text_data):
#     message = json.loads(text_data)
#     task_type = message['task_type']
#     task_args = message['task_args']
#     response = await async_to_sync(TaskConsumer().task)(task_args)
#     await self.send(text_data=json.dumps({
# 		'response': response
# 	}))


# async def receive(self, text_data):
#         message = json.loads(text_data)
#         task_type = message.get('task_type')
#         task_args = message.get('task_args')

#         if task_type and task_args:
#             # Call the long-running or asynchronous task
#             response = await self.run_task(task_args)
#             await self.send(text_data=json.dumps({
#                 'response': response
#             }))
#         else:
#             # Broadcast message to room group
#             await self.channel_layer.group_send(
#                 self.room_group_name,
#                 {
#                     'type': 'chat_message',
#                     'message': message
#                 }
#             )

# async def run_task(self, task_args):
#     # Long-running or asynchronous task
# 	return 'Task Complete!'
  

""" class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_router']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'
        
        await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)
        
        await self.accept
        
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            	self.room_group_name,
               	self.channel_name
		)
        
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        
        await self.channel_layer.group_send(
			self.room_group_name,
   			{
				'type': 'chat_message',
				'message': message
			}
		)

async def chat_message(self, event):
		message = event['message']
	
		await self.send(text_data=json.dumps
		(
		{
			'message': message
		})) """
