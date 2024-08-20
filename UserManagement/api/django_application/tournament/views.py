from django.db import DatabaseError, transaction, IntegrityError
from django.db.models import F
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.mixins import (CreateModelMixin, ListModelMixin,
                                   RetrieveModelMixin)
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from .models.tournament import Tournament, TournamentError
from .models.tournament import ErrorMessages as TournamentErrorMessages
from .models.tournament_lobby import \
    ErrorMessages as TournamentLobbyErrorMessages
from .models.tournament_lobby import TournamentLobby, TournamentLobbyError
from .models.tournament_match import TournamentMatch
from .serializers import (TournamentLobbySerializer, TournamentMatchSerializer,
                          TournamentSerializer)


class TournamentViewSet(
    GenericViewSet,
    ListModelMixin,
    RetrieveModelMixin,
    CreateModelMixin
):
    queryset = Tournament.objects.all().order_by('-id')
    serializer_class = TournamentSerializer

    @action(detail=True, methods=['post'], url_path='start')
    def start_tournament(self, request, pk=None):
        tournament = self.get_object()

        # Check if the user is the creator of the tournament
        if tournament.creator.user != request.user:
            return Response(
                {"detail": "You do not have permission to start this tournament."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Attempt to start the tournament
        try:
            tournament.start_tournament()  
            return Response(self.get_serializer(tournament).data, status=status.HTTP_200_OK)
        except TournamentError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response({"detail": TournamentErrorMessages.CONCURRENT_MODIFICATION}, status=status.HTTP_409_CONFLICT)
        
    @action(detail=True, methods=['post'], url_path='join')
    def join_lobby(self, request, pk=None):
        player_profile = request.user.profile
        try:
            with transaction.atomic():
                tournament = Tournament.objects.get(pk=pk)

                # Join the lobby
                TournamentLobby.join(tournament, player_profile)
                Tournament.objects.filter(pk=pk).update(current_number_of_players=F('current_number_of_players') + 1)

                return Response({"detail": "Successfully joined the lobby."}, status=status.HTTP_201_CREATED)
        except TournamentLobbyError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except DatabaseError:
            return Response({"detail": TournamentLobbyErrorMessages.CONCURRENT_MODIFICATION}, status=status.HTTP_409_CONFLICT)

    @action(detail=True, methods=['delete'], url_path='leave')
    def leave_lobby(self, request, pk=None):
        player_profile = request.user.profile
        try:
            with transaction.atomic():
                tournament = Tournament.objects.get(pk=pk)

                # Leave the lobby
                TournamentLobby.leave(tournament, player_profile)
                Tournament.objects.filter(pk=pk).update(current_number_of_players=F('current_number_of_players') - 1)

                return Response({"detail": "Successfully left the lobby."}, status=status.HTTP_200_OK)
        except TournamentLobbyError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except DatabaseError:
            return Response({"detail": TournamentLobbyErrorMessages.CONCURRENT_MODIFICATION}, status=status.HTTP_409_CONFLICT)    

    @action(detail=True, methods=['get'], url_path='participants')
    def list_participants(self, request, pk=None):
        tournament = self.get_object()
        queryset = tournament.lobby.all()
        queryset = TournamentLobby.objects.filter(tournament_id=pk)
        serializer = TournamentLobbySerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], url_path='matches')
    def list_matches(self, request, pk=None):
        tournament = self.get_object()
        queryset = tournament.matches.all()
        serializer = TournamentMatchSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)


class TournamentMatchViewSet(
    GenericViewSet,
    RetrieveModelMixin,
    ListModelMixin,
): 
    queryset = TournamentMatch.objects.all().order_by('-id')
    serializer_class = TournamentMatchSerializer
