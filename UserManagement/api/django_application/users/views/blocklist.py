from user_profile.models import UserProfile
from user_profile.serializers import UserProfileSerializer
from rest_framework.views import APIView
from ..models import Friend 
from rest_framework.response import Response 
from .friendship_view import validate_friend_id

# 	path('blocklist/add/', BlockListAddView.as_view(), name='blocklist-add'),

# 	path('blocklist/remove/', BlockListRemoveView.as_view(), name='blocklist-remove'),

	
# GET http://localhost:8000/api/v1/users/blocklist/	shows all blocked friends
# Shows list of friends for a user
class BlockListView(APIView):
	@staticmethod
	def get(request):
		user_id = request.user.id
		try:
			friends = Friend.objects.filter(user_id=user_id)
		except Exception as e:
			return Response(data={'error': str(e)}, status=500)

		block_list = []
		for friend in friends:
			try:
				user_profile = UserProfile.objects.get(user_id=friend.friend_id)
				user_profile_data = UserProfileSerializer(user_profile).data
				if friend.status == Friend.BLOCKED:
					status = 'blocked'
					blocklist_data = {

						"UserProfile": user_profile_data,
						"Status": {
							"status": status
						}
					}
					block_list.append(blocklist_data)
			except UserProfile.DoesNotExist:
				continue
		return Response(data=block_list, status=200)


# PATCH http://localhost:8000/api/v1/users/blocklist/add/?blocked_id=2 adds friend with id_2 to blocklist
class BlockListAddView(APIView):
	@staticmethod
	def patch(request):
		user_id = request.user.id
		blocked_id = request.GET.get('blocked_id')
		valid, error = validate_friend_id(blocked_id)
		if not valid:
			return Response(data = {'error': error}, status=400)
		try:
			relationship = Friend.objects.get(user_id=user_id, friend_id=blocked_id)
			print(relationship.status)
			if relationship.status == Friend.BLOCKED:
				return Response(data = {'error': 'friend is already blocked'}, status=400)
		except Friend.DoesNotExist:
			relationship = Friend.objects.create(user_id=user_id, friend_id=blocked_id, status=Friend.BLOCKED)
		relationship.status = Friend.BLOCKED
		relationship.save()
		return Response(data = {'message': 'friend has been added to blocklist'}, status=200)


# PATCH http://localhost:8000/api/v1/users/blocklist/remove/?blocked_id=2 removes friend with id_2 from blocklist
class BlockListRemoveView(APIView):
	@staticmethod
	def patch(request):
		user_id = request.user.id
		blocked_id = request.GET.get('blocked_id')
		valid, error = validate_friend_id(blocked_id)
		if not valid:
			return Response(data = {'error': error}, status=400)
		try:
			relationship = Friend.objects.get(user_id=user_id, friend_id=blocked_id)
		except Friend.DoesNotExist:
			return Response(data = {'error': 'friend has not been blocked'}, status=400)
		if relationship.status != Friend.BLOCKED:
			return Response(data = {'error': 'friend has not been blocked'}, status=400)
		relationship.delete()
		backward_relationship = Friend.objects.get(user_id=blocked_id, friend_id=user_id)
		if backward_relationship is not None:
			backward_relationship.delete()
		return Response(data = {'message': 'friend has been removed from a blocklist'}, status=200)
