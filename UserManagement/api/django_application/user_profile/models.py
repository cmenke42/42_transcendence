from typing import Collection
from django.db import models
from django.conf import settings
from django.core.validators import RegexValidator, MinLengthValidator
from django.core.exceptions import ValidationError
#from users.utils import get_base_user_directory_path
import re

# def get_user_avatar_path(instance, filename):
#     """
#     Will return the path where to store the user avatar
#     """
#     base_path = get_base_user_directory_path(instance.user.id)
#     return "{0}user_profile/avatar".format(base_path)

class UserProfile(models.Model):
    user = models.OneToOneField(
        to=settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="profile",
    )
    #TODO: add a default value of nickname-<user.id> and reserve it for that user
    nickname = models.CharField(verbose_name="nickname",
                                max_length=50,
                                unique=True,
                                help_text="Required. 50 or fewer characters. \
                                    Only alphanumeric characters and -",
                                validators=[RegexValidator(
                                    regex="^[a-zA-Z0-9-]+$",
                                    message="Only alphanumeric characters and -"
                                    ),
                                    MinLengthValidator(
                                        5,
                                        message="Nickname must be at least 5 characters long.",
                                    ),
                                ],
    )

    # # will be stored as avatar.<extension>
    # # NOTE: The file is saved as part of saving the model in the database,
    # # so the actual file name used on disk cannot be relied on until after the model has been saved.
    # avatar = models.ImageField(null = True, blank = True, verbose_name="avatar",
    #                            upload_to=get_user_avatar_path,
    #                            max_length=200, default='images/default.png',
    # )#TODO: add validation mechanism to check extension and no malicious content

    avatar = models.ImageField(null = True, blank = True, verbose_name="avatar",
                               upload_to="avatars/",
                               max_length=200, default= 'default.png',
    )#TODO: add validation mechanism to check extension and no malicious content
    
    intra_avatar = models.URLField(verbose_name="intra_avatar",null = True, blank=True)

    LANGUAGE_CHOICES = (
        ('en', 'English'),
        ('ru', 'Russian'),
        ('de', 'German'),
        ('pk', 'Urdu'),
    )
    preferred_language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default='en')
    
    def clean_nickname(self):
        nickname = str(self.nickname)
        pattern = re.compile(r'^nickname.-\d+$')
        if (pattern.match(nickname)
            and nickname[len("nickname-"):] != self.user.id
        ):
            raise ValidationError(
                message="This nickname is reserverd for someone else.",
                code="invalid",
                params={"value": self.nickname}
            )

    def save(self, *args, **kwargs):
        if not self.nickname:
            self.nickname = "nickname-{0}".format(self.user.id)
        # self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return str(self.nickname)

# class UserProfile(models.Model):
#     person = models.OneToOneField(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='userprofile', primary_key=True)
#     nickname = models.CharField(max_length=60, default="DefaultNickname")
#     avatar = models.CharField(max_length=60, default="DefaultAvatar")
#     status = models.CharField(max_length=60, default="offline")
    
#     def __str__(self):
#        return self.nickname
