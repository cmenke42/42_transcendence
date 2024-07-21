from .models import Tournament, TournamentLobby, TournamentMatch
from rest_framework import serializers
from user_profile.models import UserProfile
#serliazer class

class tournamentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tournament
        fields = ['max_players', 'tournament_status', 'created_date']

    def create(self, validated_data):
        user = self.context['request'].user
        user_profile = UserProfile.objects.get(user=user)
        return Tournament.objects.create(user_id=user_profile, **validated_data)


class TournamentListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tournament
        fields = ['id', 'user_id', 'max_players', 'tournament_status', 'created_date', 'winner_id']

"""class tournamentLobbySerializer(serializers.ModelSerializer):
    class Meta:
        model = tournament_lobby
        fields = ['tournament_status']
    def update(self, instance, validated_data):
        instance.tournament_status = 'started'
        instance.save()
        self.createTournamentMatches(instance)
        return instance
    def createTournamentMatches(self, tournament_instance):
        players = tournament_lobby.objects.filter(tournament_id=tournament_instance) """