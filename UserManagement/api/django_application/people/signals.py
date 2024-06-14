
import os
import stat
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.dispatch import Signal
from user_management.settings import MEDIA_ROOT

# Signal to create a user's profile folder
user_registered = Signal()

# Creates a user's profile folder when user registers after email verification
@receiver(user_registered)
def create_user_directory(sender, user, **kwargs):
    user_id = user.id
    user_directory = os.path.join(settings.MEDIA_ROOT, 'user_' + str(user_id))
    os.makedirs(user_directory, exist_ok=True)
    os.chmod(user_directory, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)
    

