from django.test import TestCase
from django.contrib.auth import get_user_model
from users.models.custom_user_manager import CustomUserManager

class CustomUserMangerTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.user_email = "           TEST1235@eXaMple.com        "
        cls.user_normalized_email = "test1235@example.com"
        cls.user_password = "a1s3d4f$"

    def test_create_user(self):
        user = get_user_model().objects.create_user(
            email=self.user_normalized_email,
            password=self.user_password
        )
        with self.subTest("Check email"):
            self.assertEqual(user.email, self.user_normalized_email)
        with self.subTest("Check username"):
            self.assertEqual(user.get_username(), self.user_normalized_email)
        with self.subTest("Check password"):
            self.assertNotEqual(user.password, self.user_password,
                                msg="password has to be hashed in database")
            self.assertTrue(user.check_password(self.user_password),
                            msg="paswords do not match")
        with self.subTest("Check user type"):
            self.assertFalse(user.is_superuser)
        with self.subTest("Check active status"):
            self.assertFalse(user.is_active)
        with self.subTest("Check email verification status"):
            self.assertFalse(user.is_email_verified)

    def test_create_superuser(self):
        user = get_user_model().objects.create_superuser(
            email=self.user_normalized_email,
            password=self.user_password
        )
        with self.subTest("Check email"):
            self.assertEqual(user.email, self.user_normalized_email)
        with self.subTest("Check username"):
            self.assertEqual(user.get_username(), self.user_normalized_email)
        with self.subTest("Check password"):
            self.assertNotEqual(user.password, self.user_password,
                                msg="password has to be hashed in database")
            self.assertTrue(user.check_password(self.user_password),
                            msg="paswords do not match")
        with self.subTest("Check user type"):
            self.assertTrue(user.is_superuser)
        with self.subTest("Check active status"):
            self.assertTrue(user.is_active)
        with self.subTest("Check email verification status"):
            self.assertTrue(user.is_email_verified)

    def test_normalize_email(self):
        with self.subTest("Test normal email"):
            email = "           TEST1235@eXaMple.com        "
            normalized_email = CustomUserManager.normalize_email(email)
            self.assertEqual(normalized_email, "test1235@example.com")
        with self.subTest("Test empty mail"):
            email = ""
            normalized_email = CustomUserManager.normalize_email(email)
            self.assertEqual(normalized_email, "")
        with self.subTest("Test None mail"):
            email = None
            normalized_email = CustomUserManager.normalize_email(email)
            self.assertEqual(normalized_email, "")

    def test_normalize_email_on_create_user(self):
        user = get_user_model().objects.create_user(
            email=self.user_email,
            password=self.user_password
        )
        self.assertEqual(user.email, self.user_normalized_email)
    
    def test_normalize_email_on_create_superuser(self):
        user = get_user_model().objects.create_superuser(
            email=self.user_email,
            password=self.user_password
        )
        self.assertEqual(user.email, self.user_normalized_email)
