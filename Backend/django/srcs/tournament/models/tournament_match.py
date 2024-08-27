from django.db import models
from user_profile.models import UserProfile
from django.db.models import Max, F
from django.utils import timezone
from django.db.models import Q

from .tournament import Tournament
from match.models import BaseMatch

class TournamentMatch(BaseMatch):
    player_1 = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='tournamentmatch_player_1_matches',
        null=True,
        blank=True,
        default=None,
    )
    player_2 = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='tournamentmatch_player_2_matches',
        null=True,
        blank=True,
        default=None,
    )
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='matches')
    is_bye = models.BooleanField(default=False)
    tree_level = models.IntegerField(default=0)  # level of the tree
    tree_node = models.IntegerField(default=0)  # match number

