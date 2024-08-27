
from django.db import models
from users.models.custom_user import CustomUser

class Friend(models.Model):
    
    PENDING = 0
    ACCEPTED = 1
    BLOCKED = 2
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='user')
    friend = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='friend')
    status = models.IntegerField(default=PENDING)