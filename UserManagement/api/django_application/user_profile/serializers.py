from rest_framework import serializers
from .models import UserProfile
import re
from django.core.files.images import get_image_dimensions

class UserProfileSerializer(serializers.ModelSerializer):
    
    nickname = serializers.CharField(allow_blank=True)

    class Meta:
        model = UserProfile
        fields = ['user_id', 'nickname', 'avatar', 'online_status', 'intra_avatar']

    def validate_nickname(self, value):
        if not re.match(r'^[a-zA-Z0-9-]+$', value) and not "" in value:
            raise serializers.ValidationError("Nickname can only contain alphanumeric characters.")

        if UserProfile.objects.filter(nickname=value).exists() and (value != self.instance.nickname):
            raise serializers.ValidationError("Nickname already exists.")

        
    def validate_avatar(self, value):
        # Check file extension
            valid_extensions = ['jpg', 'jpeg', 'png']
            extension = value.name.split('.')[-1].lower()
            if extension not in valid_extensions:
                raise serializers.ValidationError("Unsupported file extension. Allowed extensions are: jpg, jpeg, png.")
            
            # Check file size
            max_size = 2 * 1024 * 1024  # 2 MB
            if value.size > max_size:
                raise serializers.ValidationError("File size should be less than 2 MB.")
            
            # Check image dimensions
            max_width = 800
            max_height = 800
            width, height = get_image_dimensions(value)
            if width > max_width or height > max_height:
                raise serializers.ValidationError("Image dimensions should not exceed 800x800 pixels.")
