from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings
from django.core import mail
from user_login.otp_service import OTPService
import datetime

class OTPServiceTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        User = get_user_model()
        cls.user_email = "1@example.com"
        cls.user_password = "a1s3d4f$"
        cls.user = User.objects.create(email=cls.user_email, password=cls.user_password)

    def test_generate_otp(self):
        OTPService.generate_otp(self.user)
        with self.subTest("Test otp_expiry is between 90 and 120 seconds in the future"):
            self.assertIsNotNone(self.user.otp_expiry)
            self.assertTrue(
                self.user.otp_expiry >= timezone.now() + datetime.timedelta(seconds=90),
                msg="otp_expiry should be at least 90 seconds in the future")
            self.assertTrue(
                self.user.otp_expiry <= timezone.now() + datetime.timedelta(seconds=120),
                msg="otp_expiry should be at most 120 seconds in the future")
        with self.subTest("Test that otp field is set to correct range"):
            self.assertIsNot(self.user.otp, "", msg="OTP shouldn't be a empty string")
            self.assertTrue(100000 <= int(self.user.otp) <= 999999)

    def test_otp_email(self):
        OTPService.generate_otp(self.user)
        OTPService.send_otp_email(self.user)
        with self.subTest("Test number of emails sent"):
            self.assertEqual(len(mail.outbox), 1)
        with self.subTest("Test email subject"):
            self.assertEqual(mail.outbox[0].subject, "Your 2FA OTP Code")
        with self.subTest("Test OTP code in email body"):
            self.assertIn(f"Your OTP code is {self.user.otp}", mail.outbox[0].body)
        with self.subTest("Test OTP expiry in email body"):
            self.assertIn(f"It will expire in {settings.OTP_EXPIRY_MINUTES} minutes.", mail.outbox[0].body)
        with self.subTest("Test from email"):
            self.assertEqual(mail.outbox[0].from_email, settings.OTP_FROM_EMAIL)
        with self.subTest("Test to email"):
            self.assertEqual(mail.outbox[0].to, [self.user.email])
