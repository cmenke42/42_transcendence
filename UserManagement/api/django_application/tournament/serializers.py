from match.serializers import BaseMatchSerializer
from rest_framework import serializers
from user_management.serializers import DynamicHyperlinkedModelSerializer
from user_profile.models import UserProfile

from .models.tournament import Tournament
from .models.tournament_lobby import TournamentLobby
from .models.tournament_match import TournamentMatch

from user_profile.serializers import UserProfileSerializer


class TournamentSerializer(DynamicHyperlinkedModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    creator = UserProfileSerializer(read_only=True)
    winner = UserProfileSerializer(read_only=True)
    is_user_participant = serializers.SerializerMethodField()

    class Meta:
        model = Tournament
        fields = [
            'url', 'id', 'date_of_creation', 'creator',
            'max_players', 'status', 'status_display', 'winner', 'number_of_matches',
            'number_of_byes', 'current_number_of_players',
            'max_tree_level', 'is_user_participant',
        ]
        read_only_fields = [
            'url', 'id', 'date_of_creation', 'creator',
            'status', 'status_display', 'winner', 'number_of_matches',
            'number_of_byes', 'current_number_of_players',
            'max_tree_level', 'is_user_participant',
        ]
    
    def create(self, validated_data):
        user = self.context['request'].user
        user_profile = UserProfile.objects.get(user=user)
        validated_data['creator'] = user_profile
        return super().create(validated_data)

    def get_is_user_participant(self, obj):
        user_profile = self.context['request'].user.profile
        return obj.lobby.filter(player=user_profile).exists()

class TournamentLobbySerializer(DynamicHyperlinkedModelSerializer):
    player = UserProfileSerializer(read_only=True)

    class Meta:
        model = TournamentLobby
        fields = ['id', 'tournament', 'player']
        read_only_fields = ['id', 'tournament', 'player']


class TournamentMatchSerializer(BaseMatchSerializer):
    class Meta(BaseMatchSerializer.Meta):
        model = TournamentMatch
        fields = BaseMatchSerializer.Meta.fields + [
            'tournament', 'is_bye', 'tree_level', 'tree_node'
            ]
        read_only_fields = BaseMatchSerializer.Meta.read_only_fields + [
            'tournament', 'is_bye', 'tree_level', 'tree_node'
            ]
