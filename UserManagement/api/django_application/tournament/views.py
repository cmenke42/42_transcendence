from django.shortcuts import render
from rest_framework import viewsets, permissions, generics, status
from .models import Tournament, TournamentLobby, TournamentMatch
from .serializers import tournamentCreateSerializer, TournamentListSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from user_profile.models import UserProfile
from django.shortcuts import get_object_or_404
import random
import math

class tournament(generics.CreateAPIView):
    queryset = Tournament.objects.all()
    serializer_class = tournamentCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save()  # Remove user_id from here

class TournamentList(generics.ListAPIView): #if we need it or not
    queryset = Tournament.objects.all()
    serializer_class = TournamentListSerializer
    permission_classes = [permissions.IsAuthenticated]

class UserTournamentStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            user_profile = request.user.userprofile  # Make sure this matches your user profile relation
            tournaments = Tournament.objects.all()

            result = []
            for tournament in tournaments:
                is_participant = TournamentLobby.objects.filter(
                    user_id=user_profile,
                    tournament_id=tournament
                ).exists()

                result.append({
                    'id': tournament.id,
                    'creator_nickname' :tournament.user_id.nickname,
                    'tournament_status': tournament.tournament_status,
                    'max_players': tournament.max_players,
                    'winner_id': tournament.winner_id.pk if tournament.winner_id else None,
                    'winner_nickname': tournament.winner_id.nickname if tournament.winner_id else None,  # Use pk to access the primary key
                    'is_participant': is_participant
                })
 
            return Response(result)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class JoinTournament(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, tournament_id):
        try:
            user_profile = request.user.userprofile
            tournament = Tournament.objects.get(id=tournament_id)

            if tournament.tournament_status != 'created':
                return Response({'error': 'Tournament is not open for joining'}, status=status.HTTP_400_BAD_REQUEST)

            if TournamentLobby.objects.filter(
                user_id=user_profile,
                tournament_id=tournament
            ).exists():
                return Response({'error': 'you are already in the tournament'}, status=status.HTTP_400_BAD_REQUEST)

            if TournamentLobby.objects.filter(
                tournament_id=tournament
            ).count() >= tournament.max_players:
                return Response({'error': 'Tournament is full'}, status=status.HTTP_400_BAD_REQUEST)

            TournamentLobby.objects.create(
                user_id=user_profile,
                tournament_id=tournament
            )

            return Response({'message': 'You have joined the tournament. Good luck!'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class LeaveTournament(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, tournament_id):
        try:
            user_profile = request.user.userprofile
            tournament = Tournament.objects.get(id=tournament_id)

            tournament_lobby = TournamentLobby.objects.filter(
                user_id=user_profile,
                tournament_id=tournament
            )

            if not tournament_lobby.exists():
                return Response({'error': 'You are not in the tournament'}, status=status.HTTP_404_NOT_FOUND)

            if tournament.tournament_status != 'created':
                return Response({'error': 'Tournament is not open for leaving'}, status=status.HTTP_400_BAD_REQUEST)

            tournament_lobby.delete()

            return Response({'message': 'You have left the tournament.'}, status=status.HTTP_204_NO_CONTENT)
        except Tournament.DoesNotExist:
            return Response({'error': 'Tournament not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Generate the matches
class StartTournament(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, tournament_id):
        try:
            tournament = Tournament.objects.get(id=tournament_id)
            
            # Check if the user is the creator of the tournament
            if tournament.user_id != request.user.userprofile:
                return Response({'error': 'You are not the creator of the tournament'}, status=status.HTTP_403_FORBIDDEN)
            
            # Check if the tournament is open for starting
            if tournament.tournament_status != 'created':
                return Response({'error': 'Tournament has already been started'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if the number of participants is enough
            participants = TournamentLobby.objects.filter(tournament_id=tournament)
            if participants.count() < 3:
                return Response({'error': 'Not enough participants'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate the matches
            matches = self.generate_first_round(tournament, participants)
            # matches = self.generate_matches(tournament, participants)
            
            # Update the tournament status
            tournament.tournament_status = 'on_going'
            tournament.current_round = 1
            tournament.save()

            return Response({
                'message': 'Tournament has started.  First round matches have been generated.',
                'matches': [
                    {
                        'id': match.id,
                        'player1': match.player1_id.nickname if match.player1_id else 'Bye',
                        'player2': match.player2_id.nickname if match.player2_id else 'Bye',
                        'tree_level': match.tree_level,
                        'tree_node': match.tree_node
                    } for match in matches
                ]
            })
        except Tournament.DoesNotExist:
            return Response({'error': 'Tournament not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def generate_first_round(self, tournament, participants):
        participants = list(participants)
        random.shuffle(participants)  # Randomize the order of participants
        num_participants = len(participants)

        next_powerr_of_2 = 2 ** math.ceil(math.log2(num_participants))
        num_byes = next_powerr_of_2 - num_participants

        matches = []
        tree_node = 1

         # First, create matches for players without byes
        for i in range(0, num_participants - num_byes, 2):
            match = TournamentMatch(
                tournament_id=tournament,
                player1_id=participants[i].user_id,
                player2_id=participants[i + 1].user_id,
                tree_level=1,
                tree_node=tree_node,
                is_bye=False,
                is_played=False
            )
            matches.append(match)
            tree_node += 1

        # Then, create matches for players with byes
        for i in range(num_participants - num_byes, num_participants):
            match = TournamentMatch(
                tournament_id=tournament,
                player1_id=participants[i].user_id,
                player2_id=None,
                tree_level=1,
                tree_node=tree_node,
                is_bye=True,
                is_played=True,
                winner_id=participants[i].user_id
            )
            matches.append(match)
            tree_node += 1

        created_matches = TournamentMatch.objects.bulk_create(matches)
        return created_matches


    def generate_matches(self, tournament, participants):
        participants = list(participants)
        random.shuffle(participants)  # Randomize the order of participants

        # Calculate the number of byes needed
        num_participants = len(participants)
        num_byes = self.calculate_byes(num_participants)

        # Create a list of players including the byes
        players = [p.user_id for p in participants] + [None] * num_byes

        # Generate the matches
        matches = []
        tree_level = 0

        while len(players) > 1:
            level_matches = []
            tree_node = 1
            for i in range(0, len(players), 2):
                player1 = players[i]
                player2 = players[i + 1] if i + 1 < len(players) else None

                match = TournamentMatch(
                    tournament_id=tournament,
                    player1_id=player1,
                    player2_id=player2,
                    tree_level=tree_level,
                    tree_node=tree_node
                )
                level_matches.append(match)
                tree_node += 1

            # Save matches for this level
            TournamentMatch.objects.bulk_create(level_matches)
            matches.extend(level_matches)

            # Prepare for the next round
            players = []
            for match in level_matches:
                if match.player2_id is None:
                    players.append(match.player1_id)
                # else:
            tree_level += 1

        TournamentMatch.objects.bulk_create(matches)
        return matches

    def calculate_byes(self, num_participants):
        # Calculate the number of byes needed to reach the next power of 2
        next_power_of_2 = 2 ** (num_participants - 1).bit_length()
        return max(0, next_power_of_2 - num_participants)

class AdvanceToNextRound(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, tournament_id):
        try:
            tournament = Tournament.objects.get(id=tournament_id)
            
            current_round_matches = tournament.matches.filter(
                tournament_id=tournament,
                tree_level=tournament.current_round
            )
            
            if not all(match.is_played for match in current_round_matches):
                return Response({'error': 'Not all matches in the current round are completed'}, status=status.HTTP_400_BAD_REQUEST)
            
            tournament.advance_to_next_round()
            
            if tournament.is_completed():
                return Response({
                    'message': 'Tournament completed',
                    'winner': tournament.winner_id.nickname if tournament.winner_id else None
                })
            else:
                new_matches = tournament.matches.filter(tree_level=tournament.current_round)
                return Response({
                    'message': f'Advanced to round {tournament.current_round}',
                    'matches': [
                        {
                            'id': match.id,
                            'player1': match.player1_id.nickname if match.player1_id else 'Bye',
                            'player2': match.player2_id.nickname if match.player2_id else 'Bye',
                            'is_played': match.is_played,
                            'winner': match.winner_id.nickname if match.winner_id else None
                        } for match in new_matches
                    ]
                })

        except Tournament.DoesNotExist:
            return Response({'error': 'Tournament not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    
class TournamentMatchesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, tournament_id):
        try:
            tournament = Tournament.objects.get(id=tournament_id)
            matches = TournamentMatch.objects.filter(tournament_id=tournament).order_by('tree_level', 'tree_node')
            result = {
                'tournament_id': tournament_id,
                'tournament_status': tournament.tournament_status,
                'winner' : tournament.winner_id.nickname if tournament.winner_id else None,
                'matches': []
            }
            for match in matches:
                result['matches'].append({
                    'id' : match.id,
                    'player1' : match.player1_id.nickname if match.player1_id else None,
                    'player2' : match.player2_id.nickname if match.player2_id else None,
                    'tree_level' : match.tree_level,
                    'tree_node' : match.tree_node,
                    'is_played' : match.is_played,
                    'winner' : match.winner_id.nickname if match.winner_id else None
                })
            return Response(result)
        except Tournament.DoesNotExist:
            return Response({'error': 'Tournament not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SubmitMatchResult(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, match_id):
        try:
            match = TournamentMatch.objects.get(id=match_id)
            tournament = match.tournament_id

            #Ensure the user is a participant in the match
            # if request.user.userprofile not in [match.player1_id, match.player2_id]:
            #     return Response({'error': 'You are not a participant in the match'}, status=status.HTTP_403_FORBIDDEN)      
            
            player1_score = request.data.get('player1_score')
            player2_score = request.data.get('player2_score')

            match.update_result(player1_score, player2_score)

            #check if the all matches in the round are completed
            # if tournament.all_matches_completed_in_round(match.tree_level):
            #     tournament.advance_to_next_round()
            round_completed = tournament.all_matches_completed_in_round(match.tree_level)
            if round_completed:
                tournament.advance_to_next_round()
                # tournament.advance_to_next_round(match.tree_level)
            #check if the tournament is completed
            # if tournament.is_completed():
            #     tournament.tournament_status = 'completed'
            #     tournament.winner_id = tournament.determine_tournament_winner()
            #     tournament.save()
            # return Response({'message': 'Match result has been submitted'}, status=status.HTTP_200_OK)
            return Response({
                'message': 'Match result has been submitted',
                'round_completed': round_completed,
                'tournament_status': tournament.tournament_status,
                'winner': tournament.winner_id.nickname if tournament.winner_id else None
            }, status=status.HTTP_200_OK)
        except TournamentMatch.DoesNotExist:
            return Response({'error': 'Match not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UpdateTournamentStatus(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, tournament_id):
        try:
            tournament = Tournament.objects.get(id= tournament_id)
            # Check if the user is the creator of the tournament
            if tournament.user_id != request.user.userprofile:
                return Response({'error': 'You are not the creator of the tournament'}, status=status.HTTP_403_FORBIDDEN)
            
            if tournament.all_matches_completed():
                winner = Tournament.determine_tournament_winner(tournament)
                if winner:
                    tournament.winner_id = winner
                    tournament.tournament_status = 'completed'
                    tournament.save()
                    return Response({'message': 'Tournament has been completed. Winner: {}'.format(winner.nickname)})
                else:
                    return Response({'message': 'Tournament is still ongoing, unable to determine winner'},
                                    status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'message': 'Tournament is still ongoing'}, status=status.HTTP_400_BAD_REQUEST)
        except Tournament.DoesNotExist:
            return Response({'error': 'Tournament not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




    # def generate_first_round(self, tournament, participants):
    #     participants = list(participants)
    #     random.shuffle(participants) # Randomize the order of participants

    #     #calculate the number of byes needed
    #     num_participants = len(participants)
    #     num_byes = self.calculate_byes(num_participants)

    #     # Create a list of players including the byes
    #     players = [p.user_id for p in participants] + [None] * num_byes

    #     # Generate the matches
    #     matches = []
    #     for i in range(0, len(players), 2):
    #         player1 = players[i]
    #         player2 = players[i + 1] if i + 1 < len(players) else None

    #         match = TournamentMatch(
    #             tournament_id=tournament,
    #             player1_id=player1,
    #             player2_id=player2,
    #             tree_level=1,
    #             tree_node=i // 2 + 1
    #         )
    #         # match.save()
    #         matches.append(match)
    #     # Save matches for this level
    #     created_matches = TournamentMatch.objects.bulk_create(matches)

    #     #refresh the matches to get the ids
    #     # TournamentMatch.objects.bulk_refresh(created_matches)
    #     match_ids = [match.id for match in created_matches]
    #     return created_matches


# class AdvanceToNextRound(APIView):
#     permission_classes = [permissions.IsAuthenticated]

#     def post(self, request, tournament_id):
#         try:
#             tournament = Tournament.objects.get(id=tournament_id)
            
#             # Check if the user is the creator of the tournament
#             # if tournament.user_id != request.user.userprofile:
#             #     return Response({'error': 'You are not the creator of the tournament'}, status=status.HTTP_403_FORBIDDEN)
            
#             current_round_matches = tournament.matches.filter(
#                 tournament_id=tournament,
#                 tree_level=tournament.current_round
#             )
            
#             # Check if all matches in the current round are completed
#             if not all(match.is_played for match in current_round_matches):
#                 return Response({'error': 'Not all matches in the current round are completed'}, status=status.HTTP_400_BAD_REQUEST)

#             winners = [match.winner_id for match in current_round_matches if match.winner_id]
#             next_round = tournament.current_round + 1

#             if len(winners) > 1:
#                 new_matches = []
#                 for i in range(0, len(winners), 2):
#                     player1 = winners[i]
#                     player2 = winners[i + 1] if i + 1 < len(winners) else None

#                     match = TournamentMatch(
#                         tournament_id=tournament,
#                         player1_id=player1,
#                         player2_id=player2,
#                         tree_level=next_round,
#                         tree_node=i // 2 + 1
#                     )
#                     new_matches.append(match)

#                 created_matches = TournamentMatch.objects.bulk_create(new_matches)

#                 # If there's an odd number of winners, automatically advance the last player
#                 if len(winners) % 2 != 0:
#                     last_match = created_matches[-1]
#                     last_match.is_played = True
#                     last_match.winner_id = last_match.player1_id
#                     last_match.save()

#                 tournament.current_round = next_round
#                 tournament.save()

#                 return Response({
#                     'message': f'Advanced to round {next_round}',
#                     'matches': [
#                         {
#                             'id': match.id,
#                             'player1': match.player1_id.nickname if match.player1_id else 'Bye',
#                             'player2': match.player2_id.nickname if match.player2_id else 'Bye',
#                             'is_played': match.is_played,
#                             'winner': match.winner_id.nickname if match.winner_id else None
#                         } for match in created_matches
#                     ]
#                 })
#             else:
#                 # Tournament is completed
#                 tournament.tournament_status = 'completed'
#                 tournament.winner_id = winners[0] if winners else None
#                 tournament.save()

#                 return Response({'message': 'Tournament completed', 'winner': winners[0].nickname if winners else None})

#         except Tournament.DoesNotExist:
#             return Response({'error': 'Tournament not found'}, status=status.HTTP_404_NOT_FOUND)
#         except Exception as e:
#             return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



# class AdvanceToNextRound(APIView):
#     permission_classes = [permissions.IsAuthenticated]

#     def post(self, request, tournament_id):
#         try:
#             tournament = Tournament.objects.get(id=tournament_id)

#             # Check if the user is the creator of the tournament
#             if tournament.user_id != request.user.userprofile:
#                 return Response({'error': 'You are not the creator of the tournament'}, status=status.HTTP_403_FORBIDDEN)
            
#             # check if all the matches in the current round are completed
#             current_round_matches = tournament.matches.filter(
#                 tournament_id=tournament,
#                 tree_level=tournament.current_round
#                 )
#             if not all(match.is_played for match in current_round_matches):
#                 return Response({'error': 'Not all matches in the current round are completed'}, status=status.HTTP_400_BAD_REQUEST)
#             #Generate matches for the next round
#             next_round = tournament.current_round + 1
#             winner = [match.winner_id for match in current_round_matches if match.winner_id]

#             if len(winner) > 1:
#                 new_matches = []
#                 for i in range(0, len(winner), 2):
#                     player1 = winner[i]
#                     player2 = winner[i + 1] if i + 1 < len(winner) else None

#                     match = TournamentMatch(
#                         tournament_id=tournament,
#                         player1_id=player1,
#                         player2_id=player2,
#                         tree_level=next_round,
#                         tree_node=i // 2 + 1
#                     )
#                     new_matches.append(match)
#                 TournamentMatch.objects.bulk_create(new_matches)
#                 tournament.current_round = next_round
#                 tournament.save()

#                 return Response({
#                     'message' : f'Advanced to round {next_round}',
#                     'matches' : [
#                         {
#                             'id': match.id,
#                             'player1': match.player1_id.nickname if match.player1_id else 'Bye',
#                             'player2': match.player2_id.nickname if match.player2_id else 'Bye'
#                         } for match in new_matches
#                     ]
#                 })
#             else:
#                 #Tournament is completed
#                 tournament.tournament_status = 'completed'
#                 tournament.winner_id = winner[0] if winner else None
#                 tournament.save()

#                 return Response({'message': 'Tournament completed', 'winner': winner[0].nickname if winner else None})
#         except Tournament.DoesNotExist:
#             return Response({'error': 'Tournament not found'}, status=status.HTTP_404_NOT_FOUND)
#         except Exception as e:
#             return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)  
