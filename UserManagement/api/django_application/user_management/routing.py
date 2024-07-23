import os

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from .asgi_middleware import ASGI_SimpleJWT_AuthMiddleware
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'user_management.settings')
django_asgi_app = get_asgi_application()

from . import consumers
from django.urls import re_path


websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<room_name>\w+)/$', consumers.ChatConsumer.as_asgi()),
    # re_path(r'^ws/private_chat/(?P<username>[\w-]+)/$', consumers.PrivateChatConsumer.as_asgi()),
    re_path(r'^ws/private_chat/(?P<sender>[\w-]+)/(?P<receiver>[\w-]+)/$', consumers.PrivateChatConsumer.as_asgi()),
    re_path(r'ws/online_status/$', consumers.OnlineStatusConsumer.as_asgi()),
    re_path(r'ws/game/(?P<room_name>\w+)/$', consumers.GameConsumer.as_asgi()),
    # re_path(r'^ws/general_chat/(?P<username>[\w-]+)/$', consumers.GeneralChatConsumer.as_asgi()),

]
print("WebSocket Routes:", websocket_urlpatterns)

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AllowedHostsOriginValidator(
        ASGI_SimpleJWT_AuthMiddleware(
            URLRouter(
                websocket_urlpatterns
            )
        )
    )
})
