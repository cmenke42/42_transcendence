from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AND
from rest_framework.response import Response
from user_management.permissions import IsUserSelf, NotIntraUser

from ..serializers import ChangePasswordSerializer


#TODO: check if user gets logged out after password change
class ChangePasswordAPIView(GenericAPIView):
    """
    View for resetting the user password.
    """
    permission_classes = [
        IsUserSelf&NotIntraUser,
    ]
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        """
        Reset the user password.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'status': 'Password has been updated successfully'})

