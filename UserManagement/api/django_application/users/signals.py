# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from .models import CustomUser, UserProfile

# @receiver(post_save, sender=CustomUser)
# def create_profile(sender, instance, created, **kwargs):
#     if created:
#         UserProfile.objects.create(person=instance, nickname="DefaultNickname")
