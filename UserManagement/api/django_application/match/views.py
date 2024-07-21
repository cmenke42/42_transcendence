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

    class Meta:
        model = match1V1
        fields = ['id', 'opponent_id', 'opponent_username', 'is_played']

    def get_opponent_id(self, obj):
        user = self.context['user']
        return obj.Player2.user_id if obj.Player1 == user else obj.Player1.user_id

    def get_opponent_username(self, obj):
        user = self.context['user']
        return obj.Player2.nickname if obj.Player1 == user else obj.Player1.nickname

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def MatchView(request):
    user_id = request.query_params.get('user_id')
    
    if not user_id:
        return Response({'error': 'user_id is required'}, status=400)
    
    try:
        user = UserProfile.objects.get(user_id=user_id)
    except UserProfile.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    try:
        # Check for matches where the user is either Player1 or Player2
        matches = match1V1.objects.filter(
            models.Q(Player1=user) | models.Q(Player2=user),
            is_played=False
        )

        if matches.exists():
            serializer = MatchSerializer(matches, many=True, context={'user': user})
            return Response({
                'status': 'false',
                'user_id': user_id,
                'matches': serializer.data
            }, status=200)
        else:
            return Response({'status': 'true'}, status=200)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
