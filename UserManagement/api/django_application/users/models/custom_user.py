from django.db import models
from django.contrib.auth.models import PermissionsMixin
from django.contrib.auth.base_user import AbstractBaseUser

from .custom_user_manager import CustomUserManager
from user_profile.models import UserProfile

from django.utils import timezone

class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(
        verbose_name="email",
        max_length=254,
        unique=True,
        error_messages={
            "unique": "A user with that email already exists.",
            },
        help_text="Will not be used as nickname in the game."
    )
    is_active = models.BooleanField(verbose_name="active",
                                    default=False,
                                    help_text="Status of the user account",
    )
    is_admin = models.BooleanField(verbose_name="admin status",
                                   default=False,
                                   help_text="User can log into admin page?."
    )
    date_of_creation = models.DateTimeField(verbose_name="account creation",
                                            auto_now_add=True,
                                            help_text="Date when the user account was created",
    )

    # Email verification for new users
    is_email_verified = models.BooleanField(default=False)
    email_verif_token= models.CharField(max_length=128, default="")
    email_verif_token_expires = models.DateTimeField(null=True, blank=True)
    #Password fogot mail
    user_recovery_code = models.CharField(max_length=128, default="")
    user_recovery_code_expires = models.DateTimeField(null=True, blank=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name : "user"
        verbose_name_plural: "users"

    #TODO: is it needed since we dont use django admin portal??
    @property
    def is_staff(self):
        """Can the user log into the django admin site?"""
        #Simply said, all admins are staff
        return self.is_admin

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

    # def has_perm(self, perm, obj=None):
    #     "Does the user have a specific permission?"
    #     # Simplest possible answer: Yes, always
    #     return True

    # def has_module_perms(self, app_label):
    #     "Does the user have permissions to view the app `app_label`?"
    #     # Simplest possible answer: Yes, always
    #     return True



# class CustomUser(AbstractBaseUser, PermissionsMixin):
    
#     email = models.EmailField(_("email address"), unique=True)
#     # username = models.CharField(max_length=150, blank=True)
#     is_staff = models.BooleanField(default=False)
#     is_active = models.BooleanField(default=True)
#     date_joined = models.DateTimeField(default=timezone.now)
#     # Email verification for new users
#     is_email_verified = models.BooleanField(default=False)
#     email_verif_token= models.CharField(max_length=128, default="")
#     email_verif_token_expires = models.DateTimeField(null=True, blank=True)
#     #Password fogot mail
#     user_recovery_code = models.CharField(max_length=12, default="")
#     user_recovery_code_expires = models.DateTimeField (null=True, blank=True)


#     USERNAME_FIELD = "email"
#     REQUIRED_FIELDS = []

#     objects = CustomUserManager()
    
    
#     def __str__(self):
#         return self.email

