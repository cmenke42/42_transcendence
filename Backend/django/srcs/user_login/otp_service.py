from django.core.mail import send_mail
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.conf import settings
import datetime
import random
import logging

logger = logging.getLogger(__name__)

class OTPService:
    @staticmethod
    def generate_otp(user):
        """
        Generate OTP and set it to the user object
        """
        user.otp = f"{random.randint(100000, 999999)}"
        user.otp_expiry = (
            timezone.now()
            + datetime.timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
        )
        user.save()
    
    @staticmethod
    def send_otp_email(user):
        try:
            send_mail(
                "Your 2FA OTP Code",
                f"Your OTP code is {user.otp} . \
                    It will expire in {settings.OTP_EXPIRY_MINUTES} minutes.",
                settings.OTP_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error(
                "Error sending OTP email to user with ID %s: %s", user.id, e
            )