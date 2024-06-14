# signals.py
from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.dispatch import receiver
from .models import UserProfile

@receiver(user_logged_in)
def user_logged_in_handler(sender, request, user, **kwargs):
    print ("+++++++++++++++ User logged in +++++++++++++++")
    user_profile = UserProfile.objects.get(user=user)
    user_profile.online_status = 'ON'
    user_profile.save()

@receiver(user_logged_out)
def user_logged_out_handler(sender, request, user, **kwargs):
    print ("+++++++++++++++ User logged out +++++++++++++++")
    user_profile = UserProfile.objects.get(user=user)
    user_profile.online_status = 'OF'
    user_profile.save()
