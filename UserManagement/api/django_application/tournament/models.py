from django.db import models
from user_profile.models import UserProfile
from django.db.models import Max, F
from django.utils import timezone

class Tournament(models.Model):
    user_id = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='created_tournaments')
    max_players = models.IntegerField(default=16)
    tournament_status = models.CharField(max_length=100, default='created')
    winner_id = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='won_tournaments', null=True, blank=True)
    created_date = models.DateTimeField(auto_now_add=True)
    current_round = models.IntegerField(default=0)

    def all_matches_completed(self):
        return not self.matches.filter(is_played=False).exists()
    
    def all_matches_completed_in_round(self, level):
        return not self.matches.filter(tree_level=level, is_played=False).exists()
    
    def advance_to_next_round(self):
        current_round = self.matches.aggregate(Max('tree_level'))['tree_level__max']
        print(f"Current round: {current_round}")
        current_matches = self.matches.filter(tree_level=current_round)
        winners = [match.winner_id for match in current_matches if match.winner_id]
        print(f"Number of winners: {len(winners)}")

        if len(winners) > 1:
            next_round = current_round + 1
            new_matches = []
            for i in range(0, len(winners), 2):
                player1 = winners[i]
                player2 = winners[i + 1] if i + 1 < len(winners) else None
                
                match = TournamentMatch(
                    tournament_id=self,
                    player1_id=player1,
                    player2_id=player2,
                    tree_level=next_round,
                    tree_node=(i // 2) + 1
                )
                
                if player2 is None:
                    match.is_bye = True
                    match.is_played = True
                    match.winner_id = player1
                new_matches.append(match)
            
            created_matches = TournamentMatch.objects.bulk_create(new_matches)
            print(f"Created {len(created_matches)} new matches for round {next_round}")
            self.current_round = F('current_round') + 1
            self.tournament_status = 'on_going'
            self.save()
            print(f"Advanced to round {self.current_round}")
        else:
            # Tournament is completed
            self.tournament_status = 'completed'
            self.winner_id = winners[0] if winners else None
            self.save()
            print("Tournament completed")

    def is_completed(self):
        return self.tournament_status == 'completed'
        #  return self.matches.filter(tree_level=self.matches.aggregate(Max('tree_level'))['tree_level__max']).count() == 1
   
    def determine_tournament_winner(self):
        if not self.all_matches_completed():
            return None

        final_match = self.matches.order_by('-tree_level', '-tree_node').first()
        return final_match.winner_id if final_match else None



class TournamentLobby(models.Model):
    tournament_id = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='lobby_entries')
    user_id = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='tournament_lobbies')

class TournamentMatch(models.Model):
    tournament_id = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='matches')
    player1_id = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='player1_matches')
    player2_id = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='player2_matches', null=True, blank=True)
    player1_score = models.IntegerField(default=0)
    player2_score = models.IntegerField(default=0)
    winner_id = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='won_matches', null=True, blank=True)
    is_played = models.BooleanField(default=False)
    is_bye = models.BooleanField(default=False)
    tree_node = models.IntegerField(default=0)  # match number
    tree_level = models.IntegerField(default=0)  # level of the tree
    finished_date = models.DateTimeField(null=True, blank=True)

    def update_result(self, player1_score, player2_score):
        self.player1_score = player1_score
        self.player2_score = player2_score
        self.is_played = True

        if player1_score > player2_score:
            self.winner_id = self.player1_id
        elif player1_score < player2_score:
            self.winner_id = self.player2_id
        else:
            self.winner_id = None
        self.finished_date = timezone.now()
        self.save()

        #check if all matches in the current round are completed
        tournament = self.tournament_id
        all_matches_completed = not TournamentMatch.objects.filter(
            tournament_id=tournament, 
            tree_level=self.tree_level, 
            is_played=False
        ).exists()
        # ).count() == 0

        if all_matches_completed:
            # Notify that the round is completed (you can implement this as needed)
            tournament.advance_to_next_round()
            #print(f"All matches in round {self.tree_level} of tournament {tournament.id} are completed.")

    
    def save(self, *args, **kwargs):
        if self.player2_id is None:
            self.is_bye = True
            self.winner_id = self.player1_id
            self.is_played = True
        super().save(*args, **kwargs)



"""     
def advance_to_next_round(self, current_level):
        # completed_matches = self.matches.filter(tree_level=current_level, is_played=True)
        # next_level = current_level + 1
        current_round = self.matches.aggregate(Max('tree_level'))['tree_level__max']
        current_matches = self.matches.filter(tree_level=current_round)
        winners = [match.winner_id for match in current_matches if match.winner_id]

        if len(winners) > 1:
            next_round = current_round + 1
            for i in range(0, len(winners), 2):
                player1 = winners[i]
                player2 = winners[i + 1] if i + 1 < len(winners) else None
                
                TournamentMatch.objects.create(
                    tournament_id=self,
                    player1_id=player1,
                    player2_id=player2,
                    tree_level=next_round,
                    tree_node=(i // 2) + 1
                )
            self.current_round = next_round
            self.save()
        else:
            # Tournament is completed
            self.tournament_status = 'completed'
            self.winner_id = winners[0] if winners else None
            self.save() 
"""


""" 
        for i in range(0, completed_matches.count(), 2):
            winner1 = completed_matches[i].winner_id
            winner2 = completed_matches[i + 1].winner_id if i + 1 < completed_matches.count() else None
            TournamentMatch.objects.create(
                tournament_id=self,
                player1_id=winner1,
                player2_id=winner2,
                tree_level=next_level, 
                tree_node=i // 2 + 1
            )

 """
