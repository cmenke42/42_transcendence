from rest_framework import serializers
from user_management.serializers import DynamicHyperlinkedModelSerializer
from .models import BaseMatch, Match1v1
from user_profile.serializers import UserProfileSerializer

class BaseMatchSerializer(DynamicHyperlinkedModelSerializer):
    player_1 = UserProfileSerializer(read_only=True)
    player_2 = UserProfileSerializer(read_only=True)
    winner = UserProfileSerializer(read_only=True)

    class Meta:
        model = BaseMatch
        fields = [
            'id', 'player_1', 'player_2', 'player_1_score', 'player_2_score',
            'is_played', 'end_time', 'winner'
        ]
        read_only_fields = fields


class Match1v1Serializer(BaseMatchSerializer):
    class Meta(BaseMatchSerializer.Meta):
        model = Match1v1
        # fields = BaseMatchSerializer.Meta.fields + []
        # read_only_fields = BaseMatchSerializer.Meta.read_only_fields + []
