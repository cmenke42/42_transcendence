import logging
from typing import TYPE_CHECKING, Type

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from user_management.permissions import IsSuperUser, IsUserSelf

from ..serializers import BaseEmailSerializer, PasswordResetSerializer, ChangeEmailSerializer
from ..utils.account_mails import send_change_email_email

if TYPE_CHECKING:
    from ..models import CustomUser

logger = logging.getLogger(__name__)

class ObtainChangeEmailTokenAPIView(GenericAPIView):
    """
    View for sending the email change token to the user.
    """
    permission_classes = [IsUserSelf]
    serializer_class = BaseEmailSerializer

    def post(self, request):
        """
        Send the email change token to the user.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_email = serializer.validated_data['email']
        user: Type['CustomUser'] = self.request.user

        if user.email == new_email:
            return Response(
                {"status": "New email is the same as the current one"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        try:
            get_user_model().objects.get(email=new_email)
        except get_user_model().DoesNotExist:
            send_change_email_email(user, new_email)
        else:
            pass

        return Response(
            {"status": "If the email is not taken, a verification token has been sent to your new email"
            },
        )

class ChangeEmailAPIView(GenericAPIView):
    """
    View for changing the user email.
    """
    permission_classes = [AllowAny]
    serializer_class = ChangeEmailSerializer

    def post(self, request):
        """
        Update the user email.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'status': 'Email changed successfully'})
