# Create your views here.
from rest_framework import viewsets
from rest_framework.response import Response
from .models import UserProfile
from rest_framework.permissions import AllowAny
from rest_framework.decorators import permission_classes
from .serializers import UserProfileSerializer
from user_management.settings import MEDIA_ROOT , BASE_DIR
import os
import stat
from django.contrib.auth.decorators import permission_required
from django.core.exceptions import PermissionDenied
from django.db.models import Q
from users.views.friendship_view import FriendViewSet
import random



# ----------------------------------------------------- usage ---------------------------------------------------------
	# 1. See User Profile:
 
	# Request syntax: 								GET	api/v1/update_userprofile/1/?field=<field_name> 
	# z.b. see whole profile of user with id 1:		GET	http://localhost:8000/api/v1/update_userprofile/1/
	# z.b. see nickname of user with id 1:			GET	http://localhost:8000/api/v1/update_userprofile/1/?field=nickname
	# z.b. see online_status of user with id 1:		GET	http://localhost:8000/api/v1/update_userprofile/1/?field=online_status
	# z.b. see avatar of user with id 1:			GET	http://localhost:8000/api/v1/profiles/1/?field=avatar
 
 
	# 2. Update User Profile:
 
	# Request syntax: 										PATCH	api/v1/update_userprofile/1/?field=<field_name> 
	# body = {"<field_name>": "<new_value>"}
	# z.b. update nickname ofuser with id 1:				PATCH	http://localhost:8000/api/v1/update_userprofile/1/ 
	# 																body: {nickname : "new_nickname"}
	# z.b. update avatar of user with id 1:					PATCH	http://localhost:8000/api/v1/update_userprofile/1/
	# 																body: {avatar : "new_avatar"}
	# z.b. update nickname and avatar  of user with id 1:	PATCH	http://localhost:8000/api/v1/update_userprofile/1/
	# 																body: {nickname : "new_nickname", avatar : "new_avatar"}
	#
	# -------------------------------------------------------------------------------------------------------------------

from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from .models import UserProfile
from users.models import Friend
from .serializers import UserProfileSerializer


def check_permissions(func):
	def wrapper(self, request, *args, **kwargs):
		obj = self.get_object()
		if not request.user.is_authenticated:
			raise PermissionDenied("Authentication credentials were not provided.")
		elif request.user.is_superuser or obj.user == request.user:
			return func(self, request, *args, **kwargs)
		else:
			raise PermissionDenied("You do not have permission to access this object.")
	return wrapper




# TO DO ONLINE STATUS VISIBLE ONLY FOR FRIENDS
class UserProfileViewSet(viewsets.ModelViewSet):

	queryset = UserProfile.objects.all()
	serializer_class = UserProfileSerializer
  

	def retrieve(self, request, pk=None):
		try:
			user_profile = UserProfile.objects.get(pk=pk)
		except UserProfile.DoesNotExist:
			return Response({"error": "UserProfile not found"}, status=404)

		field = request.query_params.get('field')
		if field == 'nickname':
			data = {"nickname": user_profile.nickname}
		elif field == 'online_status':
			data = {"online_status": user_profile.online_status}
		elif field == 'avatar':
			if user_profile.user.is_intra_user:
				data = {"avatar": user_profile.intra_avatar}
			else:
				data = {"avatar": user_profile.avatar}
		elif field == 'preferred_language':
			data = {"preferred_language": user_profile.preferred_language}
		else:
			serializer = self.get_serializer(user_profile)
			data = serializer.data

		return Response(data)
	
 
	@check_permissions
	def partial_update(self, request, pk=None):
		try:
			user_profile = UserProfile.objects.get(pk=pk)
		except UserProfile.DoesNotExist:
			return Response({"error": "UserProfile not found"}, status=404)	
		new_nickname = request.data.get('nickname', None)
		new_avatar = request.data.get('avatar', None)
		new_language = request.data.get('preferred_language', None)
		if new_nickname is not None and user_profile.user.is_intra_user:
			return Response({"error": "Intra user cannot change nickname."}, status=400)
		elif new_nickname is not None:		
			new_nickname = request.data.get('nickname', None)
		if (request.data.get('avatar', None) is not None) and user_profile.user.is_intra_user:
			return Response({"error": "Intra user cannot change avatar."}, status=400)
		elif request.data.get('avatar', None) is not None:
			new_avatar = request.data.get('avatar', None)		

		serializer = UserProfileSerializer(user_profile, data=request.data, partial=True)
		if serializer.is_valid():
			if new_nickname != "" and new_nickname is not None:
				user_profile.nickname = new_nickname
			if new_avatar is not None:
				random_number = random.randint(100, 999)
				extension = os.path.splitext(new_avatar.name)[1]
				new_avatar_name = f'ava_of_user_{user_profile.user.id}_{random_number}'				
				full_avatar_name = f'{new_avatar_name}{extension}'
				if user_profile.avatar and os.path.isfile(user_profile.avatar.path) and user_profile.avatar.path != os.path.join(MEDIA_ROOT, 'default.png'):
					os.remove(user_profile.avatar.path)
				user_profile.avatar.save(full_avatar_name, new_avatar)
				if not os.path.isfile(user_profile.avatar.path):
					return Response('new avatar failed to save!', status=500)					
			if new_language is not None:
				user_profile.preferred_language = new_language
			user_profile.save()
			print('serializer.data', serializer.data)
			return Response(serializer.data, status=200)	
		return Response({"error": "BAD REQUEST", "details": serializer.errors}, status=400)
		


class UserListView(APIView):
    def get(self, request):
        user_id = request.user.id
        all_users = UserProfile.objects.exclude(user_id=user_id)
        
        # Fetch friend relationships
        friend_relationships = Friend.objects.filter(
            Q(user_id=user_id) | Q(friend_id=user_id)
        ).select_related('user', 'friend')
        
        # Create a dictionary of friend relationships
        friendship_status = {}
        for relationship in friend_relationships:
            other_user_id = relationship.friend_id if relationship.user_id == user_id else relationship.user_id
            if relationship.status == Friend.BLOCKED:
                status = 'blocked_by_me' if relationship.user_id == user_id else 'blocked_by_them'
            elif relationship.status == Friend.ACCEPTED:
                status = 'friends'
            else:
                status = 'sent_request' if relationship.user_id == user_id else 'received_request'
            friendship_status[other_user_id] = status

        
        # Add friendship status to user profiles
        user_list = []
        for profile in all_users:
            user_data = UserProfileSerializer(profile).data
            user_data['friendship_status'] = friendship_status.get(profile.user_id, 'not_friend')
            user_list.append(user_data)
        
        return Response(user_list, status=200)
	
""" class UserInviteMatch(APIView):
	def get(self, request):
		user_id = request.user.id
		all_users = UserProfile.objects.exclude(user_id=user_id) """
	

