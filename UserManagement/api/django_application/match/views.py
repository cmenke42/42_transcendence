from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import match1V1
from django.db import models
from users.models.custom_user import CustomUser
from user_profile.models import UserProfile
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers

class MatchSerializer(serializers.ModelSerializer):
    opponent_id = serializers.SerializerMethodField()
    opponent_username = serializers.SerializerMethodField()
    user_score = serializers.SerializerMethodField()
    opponent_score = serializers.SerializerMethodField()

    class Meta:
        model = match1V1
        # fields = ['id', 'opponent_id', 'opponent_username', 'is_played']
        fields = ['id', 'opponent_id', 'opponent_username', 'is_played', 'user_score', 'opponent_score', 'finished_data']

    def get_opponent_id(self, obj):
        user_id = int(self.context['user_id'])
        return obj.Player2.user_id if obj.Player1.user_id == user_id else obj.Player1.user_id

    def get_opponent_username(self, obj):
        user_id = int(self.context['user_id'])
        return obj.Player2.nickname if obj.Player1.user_id == user_id else obj.Player1.nickname
    def get_user_score(self, obj):
        user_id = int(self.context['user_id'])
        return obj.Player1_score if obj.Player1.user_id == user_id else obj.Player2_score
    def get_opponent_score(self, obj):
        user_id = int(self.context['user_id'])
        return obj.Player2_score if obj.Player1.user_id == user_id else obj.Player1_score

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def MatchView(request):
    user_id = request.query_params.get('user_id')
    
    if not user_id:
        return Response({'error': 'user_id is required'}, status=400)
    
    try:
        user_id = int(user_id)
        user = UserProfile.objects.get(user_id=user_id)
    except UserProfile.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    except ValueError:
        return Response({'error': 'Invalid user_id'}, status=400)
    
    try:
        # Check for matches where the user is either Player1 or Player2
        matches = match1V1.objects.filter(
            models.Q(Player1=user) | models.Q(Player2=user),
        )
        # for match in matches:

        serializer = MatchSerializer(matches, many=True, context={'user_id': user_id})
        return Response(serializer.data, status=200)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


    #     if matches.exists():
    #         serializer = MatchSerializer(matches, many=True, context={'user': user})
    #         return Response({
    #             'status': 'false',
    #             'user_id': user_id,
    #             'matches': serializer.data
    #         }, status=200)
    #     else:
    #         return Response({
    #             'status': 'true',
    #             'user_id': user_id,
    #             'matches': []
    #         }, status=200)
    # except Exception as e:
    #     return Response({'error': str(e)}, status=500)