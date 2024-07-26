from django.urls import path
from .views import *

""" def match_1v1(router):
    router.register(r'match1v1', MatchView, basename='match1v1')
    urlpatterns = router.urls """

# GET Method http://localhost:8000/api/v1/match/list/ checks if a match is remaining
urlpatterns = [
    #GET request
    path('create/', tournament.as_view(), name='tournament'),
    path('list/', TournamentList.as_view(), name='tournament_list'),
    path('user-tournament-status/', UserTournamentStatusView.as_view(), name='user-tournament-status'),

    #GET request to view the details of the players in a tournament
    path('players/<int:tournament_id>/', TournamentPlayersDetails.as_view(), name='tournament-players'),
    #POST request to join Tournament
    path('join/<int:tournament_id>/', JoinTournament.as_view(), name='join-tournament'),
    #delete request to leave Tournament
    path('leave/<int:tournament_id>/', LeaveTournament.as_view(), name='leave-tournament'),
    #post request to start Tournament
    path('start/<int:tournament_id>/', StartTournament.as_view(), name='start-tournament'),
    # path('api/tournaments/<int:tournament_id>/advance/', AdvanceToNextRound.as_view(), name='advance_tournament'),

    #GET request to view the matches of a tournament
    path('matches/<int:tournament_id>/', TournamentMatchesView.as_view(), name='tournament-matches'),
    #POST Submit match result
    path('matches/result/<int:match_id>/', SubmitMatchResult.as_view(), name='submit-match-result'),
    #POST request to advance to next round
    path('advance/<int:tournament_id>/', AdvanceToNextRound.as_view(), name='advance-tournament'),
]