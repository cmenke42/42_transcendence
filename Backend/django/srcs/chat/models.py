from django.contrib.auth.models import User
from django.db import models
from django.conf import settings
from user_profile.models import UserProfile


""" 
/home/ahsalam/42/git_save/UserManagement/api/srcs/user_profile/models.py
"""
    # sender_nickname = models.CharField(max_length=50)
    # receiver_nickname = models.CharField(max_length=50)
class PrivateChatMessage(models.Model):
    sender = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='sent_message')
    receiver = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='received_message')
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    # def __str__(self):
    #     return f'{self.sender} -> {self.receiver}: {self.message[:20]}'
    def __str__(self):
        return f"From {self.sender.nickname} to {self.receiver.nickname}: {self.content}"
    
    class Meta:
        ordering = ('timestamp',)
        
""" 
# Fetch all messages sent by a user with nickname 'sender_nickname'
sender_messages = Message.objects.filter(sender__nickname='sender_nickname')

# Fetch all messages received by a user with nickname 'receiver_nickname'
receiver_messages = Message.objects.filter(receiver__nickname='receiver_nickname')
"""