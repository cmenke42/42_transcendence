from rest_framework import serializers
from users.models import CustomUser

class SignUpSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only =True  )
    # tokens = serializers.SerializerMethodField()
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'password', 'is_staff','is_active','date_joined']
        read_only_fields= ['id',]
    
    

class EmailVerificationSerializer(serializers.ModelSerializer):
    token = serializers.CharField(max_length=555)
    class Meta:
        model = CustomUser
        fields = ['token']