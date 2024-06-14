from rest_framework import serializers
from rest_framework.renderers import JSONRenderer
from rest_framework.parsers import JSONParser
from .models import CustomUser
from user_profile.models import UserProfile

import io

class CustomUserSerializer(serializers.ModelSerializer):
    #user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    # username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField()

    class Meta:
        model = CustomUser   
        fields = "__all__"


class UserProfileSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.all())
    
    class Meta:
        model = UserProfile
        fields = '__all__'
        
# class CustomUserSerializer(serializers.Serializer):
#     username = serializers.CharField()
#     email = serializers.EmailField()
#     password = serializers.CharField()


from user_management.serializers import DynamicHyperlinkedModelSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

class UserRegisterSerializer(DynamicHyperlinkedModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ['email', 'password']
        extra_kwargs = {
            'password': {'write_only': True,
                         'validators': [validate_password] # criteria are definend in settings
                         },
        }

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = super().create(validated_data)
        user.set_password(password)
        user.save()
        return user

    
# from django.core.exceptions import ObjectDoesNotExist 

# class UserResetPasswordSerializer(DynamicHyperlinkedModelSerializer):
#     class Meta:
#         model = get_user_model()
#         fields = ['email','password']
#         extra_kwargs = {
#             'password': {'write_only': True,
#                          'validators': [validate_password] # criteria are definend in settings
#                          },
#         }
#     def post(self, validated_data):
#         email = validated_data.pop('email')
#         password = validated_data.pop('password')
#         try:
#             user = get_user_model().objects.get(email=email)
#         except ObjectDoesNotExist:
#             raise serializers.ValidationError("User with this email does not exist.")
#         if not user.reset_password_link_accepted:
#             raise serializers.ValidationError("Reset link hasn't been activated.")
#         user.reset_password_link_accepted = False
#         user.set_password(password)
#         user.save()
#         return user

# serializers.py
from rest_framework import serializers

class SetNewPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, required=True, min_length=8)

