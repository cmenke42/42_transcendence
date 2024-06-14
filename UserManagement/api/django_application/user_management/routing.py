# chat/routing.py
from django.urls import re_path, path
from . import consumers
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from channels.auth import AuthMiddlewareStack
from channels.testing import WebsocketCommunicator
import asyncio
from django.core.asgi import get_asgi_application


websocket_urlpatterns = [
    # re_path(r'ws/chat/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'ws/chat/(?P<room_name>\w+)/$', consumers.ChatConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': URLRouter(websocket_urlpatterns),
    'websocket' : AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                websocket_urlpatterns
            )
        )
    )
})


# application = ProtocolTypeRouter({
#      'http': get_asgi_application(),
#     'websocket': AllowedHostsOriginValidator(
#         AuthMiddlewareStack(
#             URLRouter([
#                 re_path(r'^ws/chat/$', consumers.ChatConsumer.as_asgi())
#             ])
#         )
#     )
# })


# application = URLRouter([
#     path("ws/chat/<str:room_name>/", consumers.ChatConsumer.as_asgi()),
# ])

# async def test_websocket():
#     communicator = WebsocketCommunicator(application, "/ws/chat/my_room/")
#     connected, subprotocol = await communicator.connect()
#     assert connected
    
#     # Send a message to the consumer
#     await communicator.send_to(text_data="Hello, world!")

#     # Receive a message from the consumer
#     message = await communicator.receive_from()
#     assert message == "Hello, world!"

#     # Close the WebSocket connection
#     await communicator.disconnect()

# asyncio.run(test_websocket())