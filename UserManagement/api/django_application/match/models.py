from django.db import models
from users.models.custom_user import CustomUser
from user_profile.models import UserProfile
# Create your models here.

class match1V1(models.Model):
    Player1 = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='Player1') #will always be who send request
    Player2 = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='Player2') #will always be who recieve request
    Player1_score = models.IntegerField(default=0)
    Player2_score = models.IntegerField(default=0)
    is_played = models.BooleanField(default=False)
    finished_data = models.DateTimeField(auto_now=True)
