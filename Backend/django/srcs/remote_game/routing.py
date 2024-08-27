# chat/routing.py
from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    # re_path(r"^ws/number_game/$", consumers.PongGameConsumer.as_asgi()),
    # re_path(r"ws/pong-match/(?P<match_type>\w+)/$", consumers.PongGameConsumer.as_asgi()),
    # re_path(r"ws/pong-match/match_type/$", consumers.PongGameConsumer.as_asgi()),
]