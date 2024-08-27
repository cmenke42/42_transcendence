import urllib.parse

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

import logging

logger = logging.getLogger(__name__)

User = get_user_model()

class ASGI_SimpleJWT_AuthMiddleware(BaseMiddleware):
    """
    Middleware to authenticate users via a Simple-JWT access token
    in the query parameter of a WebSocket connection request.
    """

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'websocket':
            return await super().__call__(scope, receive, send)

        from django.contrib.auth.models import AnonymousUser
        
        try:
            access_token = self._get_access_token(scope['query_string'])
            valid_token = AccessToken(access_token)
            user_id = valid_token['user_id']
            user = await self._get_user(user_id)
            scope['user'] = user
        except (TokenError, User.DoesNotExist, ValueError) as e:
            logger.info(f"Invalid token: {e}")
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)

    def _get_access_token(self, query_string) -> str:
        try:
            decoded_query_string = query_string.decode('utf-8')
            parsed_query = urllib.parse.parse_qs(
                qs=decoded_query_string,
                strict_parsing=True,
                max_num_fields=1,
            )
        except ValueError as e:
            raise ValueError("Invalid query parameters format.") from e

        access_token = parsed_query.get('access_token', [None])[0]
        return access_token or ""
    
    @database_sync_to_async
    def _get_user(self, user_id):
        return User.objects.get(pk=user_id)
