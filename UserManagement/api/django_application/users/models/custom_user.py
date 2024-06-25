from typing import Optional

from django.db import models
from django.contrib.auth.models import PermissionsMixin
from django.contrib.auth.base_user import AbstractBaseUser
from user_profile.models import UserProfile
from .custom_user_manager import CustomUserManager
from ..utils.send_email_with_templates import send_email_with_templates


class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(
        max_length=254,
        unique=True,
        error_messages={
            "unique": "A user with that email already exists.",
            },
        help_text="Will not be used as nickname in the game."
    )
    is_active = models.BooleanField(
        verbose_name="active",
        default=True,
        help_text="Status of the user account",
    )
    is_intra_user = models.BooleanField(
        default=False,
        help_text="Was user registered via 42 Intra?"
    )
    date_of_creation = models.DateTimeField(
        verbose_name="account creation",
        auto_now_add=True,
        help_text="Date when the user account was created",
    )

    # Email verification for new users
    is_email_verified = models.BooleanField(default=True)

    # 2FA fields
    is_2fa_enabled = models.BooleanField(default=False)
    otp = models.CharField(
        max_length=6,
        blank=True,
    )
    otp_expiry = models.DateTimeField(blank=True, null=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name : "user"
        verbose_name_plural: "users"

    def clean(self):
        """
        normalizes the email which is used as username and overrides the base
        class default.
        """
        self.email = CustomUserManager.normalize_email(self.email)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # creating the UserProfile when the user is created
        UserProfile.objects.get_or_create(user=self)

    def __str__(self):
        return self.email

    def email_user(
            self,
            subject: str,
            body: str = "",
            from_email: Optional[str] = None,
            html_message_template_name: Optional[str] = None,
            text_message_template_name: Optional[str] = None,
            context: Optional[dict] = None,
        ):
        """
        Convenience method for sending an email to this user.
        Context for templates can be passed as dictionary.
        """
        send_email_with_templates(
            subject,
            body,
            from_email,
            self.email,
            html_message_template_name,
            text_message_template_name,
            context,
        )
        


    # def has_perm(self, perm, obj=None):
    #     "Does the user have a specific permission?"
    #     # Simplest possible answer: Yes, always
    #     return True

    # def has_module_perms(self, app_label):
    #     "Does the user have permissions to view the app `app_label`?"
    #     # Simplest possible answer: Yes, always
    #     return True
