from django.db import models
from users.models.custom_user import CustomUser
from user_profile.models import UserProfile

class GameInvitation(models.Model):
    PENDING = 'PENDING'
    COMPLETED = 'completed'
    DECLINED = 'declined'
    ACCEPTED = 'accepted'

    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (COMPLETED, 'Completed'),
        (DECLINED, 'Declined'),
        (ACCEPTED, 'Accepted'),
    ]

    sender = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='sent_game_invitations')
    recipient = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='received_game_invitations')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.sender} invited {self.recipient} to a game. Status: {self.status}"