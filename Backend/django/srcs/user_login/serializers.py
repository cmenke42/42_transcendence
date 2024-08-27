from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.views import APIView
from users.models import CustomUser

from django.utils import timezone

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
        
    @classmethod
    def get_token(cls, user):
        token = super(MyTokenObtainPairSerializer, cls).get_token(user)
        #token = super().get_token(user)
        #Add custom claims
        token['email'] = user.email
        token['is_superuser'] = user.is_superuser
        token['is_intra_user'] = user.is_intra_user
        return token

    
class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField()
    
    def validate(self, data):
        try:
            user = CustomUser.objects.get(email=data['email'])
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("Email does not exist")
        
        if user.otp != data['otp']:
            raise serializers.ValidationError("OTP is incorrect")
        
        if user.otp_expiry < timezone.now():
            raise serializers.ValidationError("OTP has expired")
        
        return data
        
