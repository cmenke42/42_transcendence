import logging

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.viewsets import ModelViewSet
from user_management.permissions import IsSuperUser, IsUserSelf

from ..serializers import UserIdAndTokenSerializer, UserSerializer
from ..utils.account_mails import send_account_activation_email
from ..utils.exceptions import EmailSendingFailed
from ..utils.tokens import account_activation_token_generator

logger = logging.getLogger(__name__)

class UserAccountViewSet(ModelViewSet):
    """
    Viewset for managing user accounts of the user model.
    """
    User = get_user_model()
    queryset = User.objects.all().order_by('-id')
    serializer_class = UserSerializer
    permission_classes = [IsSuperUser]

    def get_permissions(self):
        """
        Custom permissions for the viewset depending on the action
        """
        # Sign up of new users
        if self.action == 'create' or self.request.method == 'OPTIONS':
            self.permission_classes = [AllowAny]
        # Viewing the account details of the user
        elif self.action in ['retrieve', 'update', 'partial_update']:
            self.permission_classes = [IsSuperUser|IsUserSelf]
        return super().get_permissions()
    
    def get_serializer(self, *args, **kwargs):
        """
        Adjust the serialized 'fields' of the User model depending on the action
        and the user's permissions
        """
        if not IsSuperUser().has_permission(self.request, self):
            if self.action == 'create':
                kwargs['fields'] = ['email', 'password']
            elif self.action == 'retrieve':
                kwargs['fields'] = ['email', 'is_active']
            elif self.action in ['update', 'partial_update']:
                kwargs['fields'] = ['is_active']
        return super().get_serializer(*args, **kwargs)

    @transaction.atomic
    def perform_create(self, serializer: serializer_class):
        """
        Extra actions to be performed when creating a new user.
        """
        user = serializer.save()
        try:
            send_account_activation_email(user)
        except EmailSendingFailed:
            logger.error("Failed to send account activation email")
            raise
        logger.info("Created a new user account: %s", user.id)
    
    def destroy(self, request, *args, **kwargs):
        """
        Disabling the deletion of user accounts.
        """
        return Response(
            {'status': 'User account deletion is not allowed'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )


class ActivateAccountAPIView(GenericAPIView):
    """
    View for activating the user account with the activation link.
    """
    permission_classes = [AllowAny]
    serializer_class = UserIdAndTokenSerializer

    def get_serializer(self, *args, **kwargs):
        """
        Adjust the kwargs to include the right token generator
        """
        kwargs['token_generator'] = account_activation_token_generator
        return super().get_serializer(*args, **kwargs)

    def post(self, request):
        """
        Activate the user account after validating the user_id and token.
        """
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except serializers.ValidationError:
            logger.warning("Invalid activation link")
            raise

        user = serializer.validated_data['user']
        user.is_active = True
        user.is_email_verified = True
        user.save()
        logger.info("Activated user account: %s", user.id)
        return Response({'status': 'User account activated successfully'})
