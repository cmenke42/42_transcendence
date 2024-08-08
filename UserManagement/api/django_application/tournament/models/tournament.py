from django.db import models
from user_profile.models import UserProfile
from django.core.validators import MinValueValidator, MaxValueValidator
import math
import random
from typing import List, Type, TYPE_CHECKING, Optional
from django.utils import timezone
from django.db import transaction
from django.db.models import F
from django.db import IntegrityError

if TYPE_CHECKING:
    from .tournament_match import TournamentMatch
    from .tournament_lobby import TournamentLobby

TOURNAMENT_MIN_PLAYERS = 3

class TournamentError(Exception):
    pass

class ErrorMessages:
    TOURNAMENT_CANT_START = "Tournament cannot be started because it has already been started."
    INSUFFICIENT_PLAYERS = f"Not enough players to start the tournament. Minimum players required: {TOURNAMENT_MIN_PLAYERS}"
    CONCURRENT_MODIFICATION = "The tournament was modified by another process. Please try again."

class Tournament(models.Model):
    date_of_creation = models.DateTimeField(
        auto_now_add=True,
    )
    creator = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='created_tournaments',
    )
    max_players = models.IntegerField(
        default=16,
        validators=[MinValueValidator(3), MaxValueValidator(128)]
    )

    class Status(models.TextChoices):
        CREATED = 'CR', 'created'
        ONGOING = 'ON', 'on_going'
        COMPLETED = 'CO', 'completed'

    status = models.CharField(
        max_length=2,
        choices=Status.choices,
        default=Status.CREATED,
        verbose_name='Tournament Status'
    )
    winner = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='won_tournaments',
        null=True,
        blank=True,
        default=None
    )
    number_of_matches = models.IntegerField(default=0)
    number_of_byes = models.IntegerField(default=0)
    current_number_of_players = models.IntegerField(default=0)
    max_tree_level = models.IntegerField(default=0)

    def get_status_display(self):
        """
        Get the human readable status of the tournament.
        """
        return self.Status(self.status).label

    @transaction.atomic
    def start_tournament(self):
        """
        Generate all matches for the tournament and
        change the status to ONGOING.
        """
        from .tournament_match import TournamentMatch

        self.can_start()
        tournament = Tournament.objects.select_for_update().get(pk=self.pk)
        self.can_start()

        tournament.status = self.Status.ONGOING
        tournament.max_tree_level = Tournament._calculate_max_tree_level(tournament.current_number_of_players)
        tournament.number_of_byes = Tournament._calculate_number_of_byes(tournament.current_number_of_players)
        tournament.number_of_matches = tournament.number_of_byes + tournament.current_number_of_players -1
        tournament.save()

        self.refresh_from_db()

        matches = self._generate_matches()
        self._assign_players_to_first_round(matches)
        TournamentMatch.objects.bulk_create(matches)

        for i in range(self.number_of_byes):
            Tournament.update_match_and_assign_player_to_next_match(matches[i])

    @staticmethod
    def _calculate_max_tree_level(number_of_participants):
        """
        Calculate the maximum number of rounds needed for a tournament.
        """
        if number_of_participants <= 1:
            return 0
        return math.ceil(math.log2(number_of_participants))

    @staticmethod
    def _calculate_number_of_byes(number_of_participants):
        """
        Calculate the number of byes needed for a tournament.
        """
        next_power_of_two = 2 ** math.ceil(math.log2(number_of_participants))
        return next_power_of_two - number_of_participants


    def _generate_matches(self):
        """
        Generate all match objects for the tournament.
        """
        matches = []
        tree_level = 0

        while tree_level < self.max_tree_level:
            matches_in_level = self._generate_matches_for_tree_level(self.max_tree_level, tree_level)
            matches.extend(matches_in_level)
            tree_level += 1
        return matches
        
    def _generate_matches_for_tree_level(self, max_tree_level, tree_level):
        """
        Generate all match objects for a given tree level.
        """
        # minus 1 because tree level starts from 0
        number_of_matches = int(math.pow(2, max_tree_level - tree_level - 1))
        matches = [self._generate_one_match(tree_level=tree_level, tree_node=i) for i in range(number_of_matches)]
        return matches

        
    def _generate_one_match(self, tree_level, tree_node):
        """
        Generate a single match object for the tournament.
        """
        from .tournament_match import TournamentMatch

        match = TournamentMatch(
            tournament=self,
            tree_node=tree_node,
            tree_level=tree_level,
        )
        return match

    @transaction.atomic
    def _assign_players_to_first_round(self, matches: List['TournamentMatch']):
        """
        Assign players to the first round of the tournament.
        And handle the bye cases if the number of players is odd.
        """
        participants: List['TournamentLobby'] = list(self.lobby.select_for_update().all())
        number_of_participants = len(participants)
        
        if number_of_participants != self.current_number_of_players:
            raise TournamentError(ErrorMessages.CONCURRENT_MODIFICATION)

        random.shuffle(participants)
        number_of_byes = self.number_of_byes

        # Assign bye matches
        for i in range(number_of_byes):
            print("i: ",i)
            match = matches[i]
            match.player_1 = participants[i].player
            match.player_2 = None
            match.is_bye = True
            match.winner = match.player_1

        # Assign players to matches without byes
        j = number_of_byes
        for i in range(j, self.current_number_of_players, 2):
            print("second i: ",i)
            match = matches[j]
            match.player_1 = participants[i].player
            match.player_2 = participants[i + 1].player
            j += 1

    @transaction.atomic
    @staticmethod
    def update_match_and_assign_player_to_next_match(match: 'TournamentMatch'):
        """
        Update the current match and assign the winner to the next match or as the winner of the tournament.
        """
        tournament = match.tournament

        # Mark the current match as played
        match.is_played = True
        match.end_time = timezone.now()
        match.save()

        if match.tree_level + 1 == tournament.max_tree_level:
            # This is the final match
            tournament.winner = match.winner
            tournament.status = Tournament.Status.COMPLETED
            tournament.save()
        else:
            next_tree_level = match.tree_level + 1
            next_tree_node = match.tree_node // 2

            next_match = tournament.matches.get(tree_level=next_tree_level, tree_node=next_tree_node)

            if match.tree_node % 2 == 0:
                next_match.player_1 = match.winner
                next_match.save(update_fields=['player_1'])
            else:
                next_match.player_2 = match.winner
                next_match.save(update_fields=['player_2'])
    
    def can_start(self):
        if self.status != self.Status.CREATED:
            raise TournamentError(ErrorMessages.TOURNAMENT_CANT_START)

        if self.current_number_of_players < TOURNAMENT_MIN_PLAYERS:
            raise TournamentError(ErrorMessages.INSUFFICIENT_PLAYERS)

