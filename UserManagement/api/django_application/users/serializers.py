from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import \
    validate_password as django_validate_password
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers

from user_management.serializers import DynamicHyperlinkedModelSerializer

from .models.custom_user_manager import CustomUserManager
from .models.game_invitation import GameInvitation
from .utils.tokens import change_email_token_generator


class UserSerializer(DynamicHyperlinkedModelSerializer):
    """
    Serializer for the User model
    """
    class Meta:
        model = get_user_model()
        fields = ['url', 'id', 'email', 'is_active', 'password',
                  'is_superuser', 'date_of_creation', 'last_login',
                  'is_email_verified', 'is_2fa_enabled', 'is_intra_user'
        ]
        read_only_fields = ['url', 'id', 'date_of_creation', 'last_login']
        extra_kwargs = {
            'password': {'write_only': True},
            'url': {'view_name': 'user-detail'},
        }

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = super().create(validated_data)
        user.set_password(password)
        user.save(update_fields=['password'])
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password is not None:
            user.set_password(password)
            user.save(update_fields=['password'])
        return user

    
    def validate_password(self, value):
        """
        Enforce password validation when the user is not a superuser
        """
        # commented because intra api process needs this to be commented
        #if not self.context['request'].user.is_superuser:
        django_validate_password(value)
        return value
    
    def validate_email(self, value):
        return CustomUserManager.normalize_email(value)



class UserIdAndTokenSerializer(serializers.Serializer):
    """
    Serializer for user_id_b64 and token fields

    Keyword arguments:
    token_generator -- the token generator object
    """
    user_id_b64 = serializers.CharField(write_only=True)
    token = serializers.CharField(write_only=True)

    def __init__(self, *args, **kwargs):
        self.token_generator = kwargs.pop('token_generator')
        self.User = get_user_model()
        super().__init__(*args, **kwargs)
    
    def create(self, validated_data):
        pass

    def update(self, instance, validated_data):
        pass

    def validate(self, data):
        """
        Validate the user_id and token
        """
        data = super().validate(data)
        user_id_b64 = data['user_id_b64']
        token = data['token']

        try:
            user_id = urlsafe_base64_decode(user_id_b64).decode()
            user = self.User.objects.get(id=user_id)
            if not self.token_generator.check_token(
                user,
                token,
            ):
                raise ValueError
        except (ValueError, TypeError,
                OverflowError, self.User.DoesNotExist) as e:
            raise serializers.ValidationError("Invalid token link") from e

        # Add the user to the validated data so we can use it in the view
        data['user'] = user
        return data

class BaseEmailSerializer(serializers.Serializer):
    """
    Serializer for email field
    """
    email = serializers.EmailField(
        max_length=254,
    )

    def create(self, validated_data):
        pass
    
    def update(self, instance, validated_data):
        pass

    def validate_email(self, value):
        return CustomUserManager.normalize_email(value)

class BaseNewPasswordSerializer(serializers.Serializer):
    """
    Base serializer for handling password
    """
    new_password = serializers.CharField(write_only=True)

    def create(self, validated_data):
        pass

    def update(self, instance, validated_data):
        pass

    def validate_new_password(self, value):
        """
        Validate the new password using UserSerializer's validation logic.
        """
        user_serializer = UserSerializer(
            data={'password': value},
            context=self.context,
            partial=True,
        )
        try:
            user_serializer.is_valid(raise_exception=True)
        except serializers.ValidationError as e:
            error_messages = e.detail['password']
            raise serializers.ValidationError(error_messages) from e
        return user_serializer.validated_data['password']

class PasswordResetSerializer(BaseNewPasswordSerializer, UserIdAndTokenSerializer):
    """
    Serializer for resetting the user's password
    """
    def save(self, **kwargs):
        """
        Update the user's password
        """
        user = self.validated_data['user']
        new_password = self.validated_data['new_password']
        user.set_password(new_password)
        user.save(update_fields=['password'])


class ChangePasswordSerializer(BaseNewPasswordSerializer):
    """
    Serializer for changing the user's password
    """
    old_password = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Invalid password")
        return value

    def save(self, **kwargs):
        """
        Update the user's password
        """
        user = self.context['request'].user
        new_password = self.validated_data['new_password']
        user.set_password(new_password)
        user.save(update_fields=['password'])

class ChangeEmailSerializer(serializers.Serializer):
    """
    Serializer for changing the user's email
    """
    user_id_b64 = serializers.CharField(
        write_only=True,
        help_text="The user's id encoded in base64",
    )
    email_b64 = serializers.CharField(
        write_only=True,
        help_text="The new email encoded in base64",
    )
    token = serializers.CharField(
        write_only=True,
        help_text="The token received in the new email",
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.User = get_user_model()
    
    def create(self, validated_data):
        pass

    def update(self, instance, validated_data):
        pass

    def validate(self, data):
        """
        Validate that new_email is the same in the token
        """
        data = super().validate(data)
        # Decode the user_id_b64 and get the user
        # Decode the email and get the new_email
        try:
            user_id = urlsafe_base64_decode(data['user_id_b64']).decode()
            user = self.User.objects.get(id=user_id)
            new_email = urlsafe_base64_decode(data['email_b64']).decode()
        except (ValueError, TypeError, OverflowError, self.User.DoesNotExist) as e:
            raise serializers.ValidationError("Invalid token link") from e

        # Validate the token        
        if not change_email_token_generator.check_token(
            user,
            data['token'],
            new_email=new_email,
        ):
            raise serializers.ValidationError("Invalid token link")

        # add the encoded email to the validated data
        data['new_email'] = new_email
        # Add the user to the validated data so we can use it in the view
        data['user'] = user
        return data

    def save(self, **kwargs):
        """
        Update the user's email
        """
        user = self.validated_data['user']
        new_email = self.validated_data['new_email']
        user.email = new_email
        user.save(update_fields=['email'])

class GameInvitationSerializer(serializers.ModelSerializer):
    """
    Serializer for the GameInvitation model
    """
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    recipient_username = serializers.CharField(source='recipient.username', read_only=True)

    class Meta:
        model = GameInvitation
        fields = ['id', 'sender', 'sender_username', 'recipient', 'recipient_username', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'sender', 'created_at', 'updated_at']