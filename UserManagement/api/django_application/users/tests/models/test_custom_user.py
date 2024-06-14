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
        with self.subTest("Test default"):
            self.assertFalse(field.default)

    def test_is_2fa_enabled_propertys(self):
        field = self.user._meta.get_field('is_2fa_enabled')
        with self.subTest("Test default"):
            self.assertFalse(field.default)

    def test_otp_propertys(self):
        field = self.user._meta.get_field('otp')
        with self.subTest("Test length"):
            self.assertEqual(field.max_length, 6)
        with self.subTest("Test blank"):
            self.assertTrue(field.blank)

    def test_otp_expiry_propertys(self):
        field = self.user._meta.get_field('otp_expiry')
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