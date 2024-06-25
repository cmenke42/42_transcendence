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
    re_path(r'ws/chat/(?P<room_name>\w+)/$', consumers.ChatConsumer.as_asgi()),
    # re_path(r'^ws/private_chat/(?P<username>[\w-]+)/$', consumers.PrivateChatConsumer.as_asgi()),
    re_path(r'^ws/private_chat/(?P<sender>[\w-]+)/(?P<receiver>[\w-]+)/$', consumers.PrivateChatConsumer.as_asgi()),
    # re_path(r'^ws/general_chat/(?P<username>[\w-]+)/$', consumers.GeneralChatConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket' : AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                websocket_urlpatterns
            )
        )
    )
})
