from rest_framework.view import APIView
from rest_framework.response import Response
from rest_framework import status
from users.models import CustomUser
from ..models.game_invitation import GameInvitation
from ..serializers import GameInvitationSerializer

class GameInvitation(APIView):
    def post(self, request):
        recipient_id = request.data.get('recipient_id')
    
        if not recipient_id:
            return Response({'error': 'Recipient ID is required'}, status=status.HTTP_400_BAD_REQUEST)
    
        try:
            recipient = CustomUser.objects.get(id=recipient_id)
        except CustomUser.DoesNotExist:
            return Response({'error': 'Recipient not found'}, status=status.HTTP_404_NOT_FOUND)
        
        invitation = GameInvitation(sender=request.user, recipient=recipient)
        invitation.save()

        serializer = GameInvitationSerializer(invitation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class RespondGameInvitation(APIView):
    def post(self, request):
        invitation_id = request.data.get('invitation_id')
        action = request.data.get('action')

        if not invitation_id or not action:
            return Response({'error': 'Invitation ID and action are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if action not in ['accept', 'decline']:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            invitation = GameInvitation.objects.get(id=invitation_id, recipient=request.user)
        except GameInvitation.DoesNotExist:
            return Response({'error': 'Invitation not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if action == 'accept':
            invitation.status = GameInvitation.ACCEPTED
        else:
            invitation.status = GameInvitation.DECLINED

        invitation.save()

        serializer = GameInvitationSerializer(invitation)
        return Response(serializer.data, status=status.HTTP_200_OK)