import logging
from typing import TYPE_CHECKING, Optional

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ..serializers import BaseEmailSerializer, PasswordResetSerializer
from ..utils.account_mails import send_password_reset_email

if TYPE_CHECKING:
    from ..models import CustomUser

logger = logging.getLogger(__name__)


#TODO: Make sure oauth users can't reset password
class ForgotPasswordAPIView(GenericAPIView):
    """
    View for sending the password reset email to the user.
    """
    permission_classes = [AllowAny]
    serializer_class = BaseEmailSerializer

    def post(self, request):
        """
        Send the password reset email to the user.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user: Optional['CustomUser'] = None
        try:
            email = serializer.validated_data['email']
            user = get_user_model().objects.get(email=email)
        except get_user_model().DoesNotExist:
            logger.warning("Invalid email in forgot password request")
        else:
            if not user.is_active:
                logger.warning("Password reset request for inactive user")
                user.email_user(
                    subject="Pong - Account Inactive",
                    text_message_template_name='users/email/forgot_password_inactive.txt',
                )
            else:
                send_password_reset_email(user)
        return Response(
            {"status": "If the email exists, a password reset link has been sent"},
        )

class ResetPasswordAPIView(GenericAPIView):
    """
    View for resetting the user password.
    """
    permission_classes = [AllowAny]
    serializer_class = PasswordResetSerializer

    def get_serializer(self, *args, **kwargs):
        """
        Adjust the kwargs to include the right token generator
        """
        kwargs['token_generator'] = default_token_generator
        return super().get_serializer(*args, **kwargs)

    def post(self, request):
        """
        Reset the user password.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'status': 'Password has been reset'})
