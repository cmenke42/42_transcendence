from typing import TYPE_CHECKING

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from ..utils.send_email_with_templates import send_email_with_templates

from .tokens import account_activation_token_generator
from .tokens import change_email_token_generator

if TYPE_CHECKING:
    from ..models import CustomUser

def send_account_activation_email(user: 'CustomUser'):
    """
    Send account activation email to the user
    """
    encoded_user_id = urlsafe_base64_encode(force_bytes(user.id))
    token = account_activation_token_generator.make_token(user)
    # TODO: adjust link so user goes to angular page
    link = "https://{FRONTEND_URL}{route}{encoded_user_id}/{token}"
    link = link.format(
        FRONTEND_URL=settings.FRONTEND_URL,
        route='/activate-account/',
        encoded_user_id=encoded_user_id,
        token=token
    )
    user.email_user(
        subject="Pong - Account Activation",
        text_message_template_name='users/email/account_activate_mail.txt',
        context={
            'user': user,
            'link': link,
            'token_expires_seconds': settings.ACCOUNT_ACTIVATION_TIMEOUT_SECONDS,
        }
    )

def send_password_reset_email(user: 'CustomUser'):
    """
    Send password reset email to the user
    """
    encoded_user_id = urlsafe_base64_encode(force_bytes(user.id))
    token = default_token_generator.make_token(user)
    # TODO: adjust link so user goes to angular page
    link = "{FRONTEND_URL}{route}{encoded_user_id}/{token}"
    link = link.format(
        FRONTEND_URL=settings.FRONTEND_URL,
        route="/reset-password/",
        encoded_user_id=encoded_user_id,
        token=token
    )
    user.email_user(
        subject="Pong - Password Reset",
        text_message_template_name='users/email/password_reset_mail.txt',
        context={
            'user': user,
            'link': link,
            'token_expires_seconds': settings.PASSWORD_RESET_TIMEOUT,
        }
    )

def send_change_email_email(user: 'CustomUser', new_email):
    """
    Send change email email to the user
    """
    encoded_user_id = urlsafe_base64_encode(force_bytes(user.id))
    token = change_email_token_generator.make_token(user, new_email=new_email)
    encoded_new_email = urlsafe_base64_encode(force_bytes(new_email))
    link = "{FRONTEND_URL}{route}{encoded_user_id}/{encoded_new_email}/{token}"
    link = link.format(
        FRONTEND_URL=settings.FRONTEND_URL,
        route="/change-email/",
        encoded_user_id=encoded_user_id,
        encoded_new_email=encoded_new_email,
        token=token
    )
    send_email_with_templates(
            to=new_email,
            subject="Pong - Change Email",
            text_message_template_name='users/email/change_email_mail.txt',
            context={
                'user': user,
                'link': link,
                'token_expires_seconds': settings.EMAIL_CHANGE_TIMEOUT_SECONDS,
            }
    )
