from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from user_profile.models import UserProfile
from ..models.game_invitation import GameInvitation
from ..serializers import GameInvitationSerializer
from match.models import match1V1
from django.db import models
from django.db.models import Q



class GameInvitationView(APIView):
    def post(self, request):
        recipient_id = request.data.get('recipient_id')
    
        if not recipient_id:
            return Response({'error': 'Recipient ID is required'}, status=status.HTTP_400_BAD_REQUEST)
    
        try:
            recipient = UserProfile.objects.get(user_id=recipient_id)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Recipient not found'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            sender_profile = UserProfile.objects.get(user=request.user)
            # Check if there is already an invitation between the two users
        except UserProfile.DoesNotExist:
            return Response({'error': 'Sender not found'}, status=status.HTTP_404_NOT_FOUND)
        
        invitation = GameInvitation(sender=sender_profile, recipient=recipient)
        invitation.save()

        serializer = GameInvitationSerializer(invitation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class RespondGameInvitation(APIView):
    def post(self, request):
        receiver_id = request.data.get('receiver_id')
        action = request.data.get('action')

        if not receiver_id or not action:
            return Response({'error': 'Receiver ID and action are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if action not in ['accept', 'decline']:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            current_user_profile = UserProfile.objects.get(user=request.user)
            receiver_profile = UserProfile.objects.get(user_id=receiver_id)
            
            # Find the invitation where the current user is the recipient and the specified user is the sender
            invitation = GameInvitation.objects.get(
                sender=receiver_profile,
                recipient=current_user_profile
            )
            
        except UserProfile.DoesNotExist:
            return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)
        except GameInvitation.DoesNotExist:
            return Response({'error': 'Invitation not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if action == 'accept':
            match = match1V1(Player1=invitation.sender, Player2=invitation.recipient)
            match.save()
            invitation.delete()
            return Response({'message': 'Invitation is accepted. Good luck!'}, status=status.HTTP_200_OK)
        elif action == 'decline':
            invitation.delete()
            return Response({'message': 'Invitation is rejected. Sorry :('}, status=status.HTTP_200_OK)


class CheckGameInvitation(APIView):
    def get(self, request):
        other_user_id = request.query_params.get('user_id')

        if not other_user_id:
            return Response({'error': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            other_user = UserProfile.objects.get(user_id=other_user_id)
            current_user_profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        invitation = GameInvitation.objects.filter(
            (models.Q(sender=current_user_profile) & models.Q(recipient=other_user)) |
            (models.Q(sender=other_user) & models.Q(recipient=current_user_profile))
        ).first()

        if invitation:
            serializer = GameInvitationSerializer(invitation)
            is_sender = invitation.sender == current_user_profile
            return Response({
                'status': 'sent' if is_sender else 'received',
                'invitation': serializer.data,
                'can_respond': not is_sender
            }, status=status.HTTP_200_OK)
        else:
            return Response({'status': 'no invitation'}, status=status.HTTP_200_OK)
