from unittest.mock import patch, create_autospec

from django.conf import settings
from django.test import SimpleTestCase
from django.urls import reverse
from users.utils.account_mails import (send_account_activation_email,
                                       send_password_reset_email,
                                       send_change_email_email)

from django.contrib.auth import get_user_model


@patch('users.utils.account_mails.force_bytes', return_value=b'bytes_user_id')
@patch('users.utils.account_mails.urlsafe_base64_encode', return_value='encoded_user_id')
class SendAccountActivationEmailTest(SimpleTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = create_autospec(get_user_model())
        cls.user.id = 1
        cls.user.email = "user@example.com"


    @patch('users.utils.tokens.account_activation_token_generator.make_token', return_value='token')
    def test_send_account_activation_email(
        self,
        mock_make_token,
        mock_urlsafe_base64_encode,
        mock_force_bytes
        ):
        send_account_activation_email(self.user)

        mock_force_bytes.assert_called_once_with(self.user.id)
        mock_urlsafe_base64_encode.assert_called_once_with(b'bytes_user_id')
        mock_make_token.assert_called_once_with(self.user)

        expected_link = f"{settings.FRONTEND_URL}{reverse('user-activate')}encoded_user_id/token/"
        self.user.email_user.assert_called_once_with(
            subject="Pong - Account Activation",
            text_message_template_name='users/email/account_activate_mail.txt',
            context={
                'user': self.user,
                'link': expected_link,
                'token_expires_seconds': settings.ACCOUNT_ACTIVATION_TIMEOUT_SECONDS,
            }
        )
