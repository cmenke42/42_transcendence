from django.db import models
from user_profile.models import UserProfile

class BaseMatch(models.Model):
    player_1 = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='%(class)s_player_1_matches',
    )
    player_2 = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='%(class)s_player_2_matches',
    )
    player_1_score = models.IntegerField(default=0)
    player_2_score = models.IntegerField(default=0)
    is_played = models.BooleanField(default=False)
    end_time = models.DateTimeField(null=True, blank=True)
    winner = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='%(class)s_won_matches',
        null=True,
        blank=True,
        default=None
    )
    class Meta:
        abstract = True

class Match1v1(BaseMatch):
    pass
