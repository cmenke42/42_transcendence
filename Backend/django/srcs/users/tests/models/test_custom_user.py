from unittest.mock import patch

from django.test import TestCase
from django.contrib.auth import get_user_model
from user_profile.models import UserProfile

class CustomUserTestModelPropertys(TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        User = get_user_model()
        cls.user_email = "1@example.com"
        cls.user_password = "a1s3d4f$"
        cls.user = User.objects.create(email=cls.user_email, password=cls.user_password)

    def test_email_propertys(self):
        field = self.user._meta.get_field('email')
        with self.subTest("Test verbose name"):
            self.assertEqual(field.verbose_name, "email")
        with self.subTest("Test length"):
            self.assertEqual(field.max_length, 254)
        with self.subTest("Test unique"):
            self.assertTrue(field.unique)
        with self.subTest("Test error message for unique"):
            self.assertEqual(field.error_messages['unique'],
                            "A user with that email already exists.")
        with self.subTest("Test help text"):
            self.assertEqual(field.help_text,
                             "Will not be used as nickname in the game.")
        
    def test_is_active_propertys(self):
        field = self.user._meta.get_field('is_active')
        with self.subTest("Test verbose name"):
            self.assertEqual(field.verbose_name, "active")
        with self.subTest("Test default"):
            self.assertFalse(field.default)
        with self.subTest("Test help text"):
            self.assertEqual(field.help_text, "Status of the user account")

     def test_is_intra_user_properties(self):
         field = self.user._meta.get_field('is_intra_user')
         with self.subTest("Test verbose name"):
             self.assertEqual(field.verbose_name, "is intra user")
         with self.subTest("Test default"):
             self.assertFalse(field.default)
         with self.subTest("Test help text"):
             self.assertEqual(field.help_text, "Was user registered via 42 Intra?")
    
    def test_date_of_creation_propertys(self):
        field = self.user._meta.get_field('date_of_creation')
        with self.subTest("Test verbose name"):
            self.assertEqual(field.verbose_name, "account creation")
        with self.subTest("Test auto_now_add"):
            self.assertTrue(field.auto_now_add)
        with self.subTest("Test help text"):
            self.assertEqual(field.help_text, "Date when the user account was created")
    
    def test_is_email_verified_propertys(self):
        field = self.user._meta.get_field('is_email_verified')
        with self.subTest("Test verbose name"):
            self.assertEqual(field.verbose_name, "is email verified")
        with self.subTest("Test default"):
            self.assertFalse(field.default)

    def test_is_2fa_enabled_propertys(self):
        field = self.user._meta.get_field('is_2fa_enabled')
        with self.subTest("Test verbose name"):
            self.assertEqual(field.verbose_name, "is 2fa enabled")
        with self.subTest("Test default"):
            self.assertFalse(field.default)

    def test_otp_propertys(self):
        field = self.user._meta.get_field('otp')
        with self.subTest("Test verbose name"):
            self.assertEqual(field.verbose_name, "otp")
        with self.subTest("Test length"):
            self.assertEqual(field.max_length, 6)
        with self.subTest("Test blank"):
            self.assertTrue(field.blank)

    def test_otp_expiry_propertys(self):
        field = self.user._meta.get_field('otp_expiry')
        with self.subTest("Test verbose name"):
            self.assertEqual(field.verbose_name, "otp expiry")
        with self.subTest("Test null"):
            self.assertTrue(field.null)
        with self.subTest("Test blank"):
            self.assertTrue(field.blank)

class CustomUserTestModelMethods(TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        User = get_user_model()
        cls.user_email = "1@example.com"
        cls.user_password = "a1s3d4f$"
        cls.user = User.objects.create(email=cls.user_email, password=cls.user_password)
    
    def test_clean_method(self):
        self.user.email = "   Test@Example.COM   "
        self.user.clean()
        self.assertEqual(self.user.email, "test@example.com")
    
    def test_user_profile_creation(self):
        user_profile, created = UserProfile.objects.get_or_create(user=self.user)
        with self.subTest("Check if UserProfile is newly created"):
            self.assertFalse(created)
        with self.subTest("UserProfile is not None"):
            self.assertIsNotNone(user_profile)
        with self.subTest("UserProfile is related to the correct user"):
            self.assertEqual(user_profile.user, self.user)

    @patch('users.models.custom_user.send_email_with_templates')
    def test_email_user(self, mock_send_email_with_templates):
        """
        Check that the parameters are passed correctly
        to the send_email_with_templates function
        """
        subject = "Test subject"
        message = "Test message"
        from_email = "from@example.com"
        html_template = "users/email/tests/test_html_template.html"
        text_template = "users/email/tests/test_text_template.txt"
        context = {"key": "value"}

        self.user.email_user(
            subject=subject,
            body=message,
            from_email=from_email,
            html_message_template_name=html_template,
            text_message_template_name=text_template,
            context=context,
        )

        mock_send_email_with_templates.assert_called_once_with(
            subject,
            message,
            from_email,
            self.user.email,
            html_template,
            text_template,
            context,
        )
