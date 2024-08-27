from django.db import models
from user_profile.models import UserProfile
from .tournament import Tournament
from django.db.models.constraints import UniqueConstraint
from django.db.utils import IntegrityError
from django.core.exceptions import ValidationError
from django.db import DatabaseError
from django.db import transaction
from django.db.models import F

class TournamentLobbyError(Exception):
    pass

class ErrorMessages:
    ALREADY_IN_LOBBY = "You are already in the lobby."
    NOT_IN_LOBBY = "You are not in the lobby."
    CANT_LEAVE_LOBBY = "You cannot leave the lobby because the tournament has already started or finished."
    CANT_JOIN_LOBBY = "You cannot join the lobby because the tournament has already started or finished."
    IS_FULL = "The tournament lobby is already full."
    CONCURRENT_MODIFICATION = "The lobby was modified by another process. Please try again."


class TournamentLobby(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='lobby')
    player = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='tournament_participations')

    class Meta:
        constraints = [
            UniqueConstraint(fields=['tournament', 'player'], name='unique_tournament_player')
        ]

    @staticmethod
    @transaction.atomic
    def join(tournament: Tournament, player_profile):
        if tournament.status != Tournament.Status.CREATED:
            raise TournamentLobbyError(ErrorMessages.CANT_JOIN_LOBBY)
        if tournament.current_number_of_players >= tournament.max_players:
            raise TournamentLobbyError(ErrorMessages.IS_FULL)
        try:
            TournamentLobby.objects.create(tournament=tournament, player=player_profile)
        except IntegrityError:
            raise TournamentLobbyError(ErrorMessages.ALREADY_IN_LOBBY)
    
    @staticmethod
    @transaction.atomic
    def leave(tournament: Tournament, player_profile):
        if tournament.status != Tournament.Status.CREATED:
            raise TournamentLobbyError(ErrorMessages.CANT_LEAVE_LOBBY)
        try:
            lobby_entry = TournamentLobby.objects.get(tournament=tournament, player=player_profile)
            lobby_entry.delete()
        except TournamentLobby.DoesNotExist:
            raise TournamentLobbyError(ErrorMessages.NOT_IN_LOBBY)
