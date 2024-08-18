
from rest_framework.response import Response 
from django.core.exceptions import ObjectDoesNotExist 
from ..models import CustomUser
from ..models import Friend
from rest_framework.views import APIView
from rest_framework.decorators import  permission_classes
from rest_framework.permissions import AllowAny
from user_management.permissions import IsSuperUser
from user_profile.models import UserProfile
from user_profile.serializers import UserProfileSerializer
from rest_framework.decorators import action
from rest_framework import viewsets


# ====================================================================================================================

class FriendViewSet(viewsets.ViewSet):
	def list(self, request):
	# Этот метод нужен для GET запросов к корневому URL друзей
		return Response({"message": "List of friends"})

	def retrieve(self, request, pk=None):
		# Этот метод нужен для GET запросов к конкретному другу
		return Response({"message": f"Details of friend {pk}"})
	
	@action(detail=False, methods=['get'])
	def status(self, request):
		user_id = request.user.id
		friend_id = request.GET.get('friend_id')
		valid, error = validate_friend_id(friend_id)
		if not valid:
			return Response(data={'error': error}, status=400)
		try:
			friendship = Friend.objects.get(user_id=user_id, friend_id=friend_id)
		except ObjectDoesNotExist:
			return Response(data={'error': 'not a friend'}, status=200)

		if friendship.status == 0:
			status = 'pending'
		elif friendship.status == 1:
			status = 'accepted'
		elif friendship.status == 2:
			status = 'blocked'
		else:
			return Response(data={'error': 'invalid status code'}, status=500)
		return Response(data={'status': status}, status=200)

	@action(detail=False, methods=['delete'])
	def remove(self, request, pk=None):
		user_id = request.user.id
		friend_id = request.GET.get('friend_id')
		valid, error = validate_friend_id(friend_id)
		if not valid:
			return Response(data={'error': error}, status=400)
		try:
			friendship = Friend.objects.get(user_id=user_id, friend_id=friend_id)
			backward_friendship = Friend.objects.get(user_id=friend_id, friend_id=user_id)
		except ObjectDoesNotExist:
			return Response(data={'error': f'friendship not found'}, status=400)
		friendship.delete()
		backward_friendship.delete()
		send_notification(user_id, friend_id, 'Friendship request has been removed', 'remove_friendship_request', f'{user_id}')
		return Response(data={'message': f'friend with id={friend_id} has been removed from friends'}, status=200)
	
	@action(detail=False, methods=['post'])
	def request(self, request):
		user_id = request.user.id
		friend_id = request.GET.get('friend_id')
		valid, error = validate_friend_id(friend_id)
		if not valid:
			return Response(data={'error': error}, status=400)
		int_user_id = int(user_id)
		int_friend_id = int(friend_id)
		if int_user_id == int_friend_id:
			return Response(data={'error': 'cannot add self as friend'}, status=400)
		valid, error = self.check_friend_request(user_id, friend_id)
		if not valid:
			return Response(data={'error': error}, status=400)
		send_notification(user_id, friend_id, 'Friendship request has been sent', 'send_friendship_request', f'{user_id}')
		return Response(data={'message': 'friend request sent'}, status=200)
	
	@staticmethod
	def check_friend_request(user_id: int, friend_id: int):
		friendship = Friend.objects.filter(user_id=user_id, friend_id=friend_id)
		if friendship.exists():
			if friendship[0].status == Friend.PENDING:
				return False, 'friend status: pending'
			elif friendship[0].status == Friend.ACCEPTED:
				return False, 'friend status: accepted'
			elif friendship[0].status == Friend.BLOCKED:
				return False, 'friend status: blocked'
		else:
			backward_friendship = Friend.objects.filter(user_id=friend_id, friend_id=user_id)
			if backward_friendship.exists() and backward_friendship[0].status == Friend.BLOCKED:
				return False, 'you have been blocked by this user'
			Friend.objects.create(user_id=user_id, friend_id=friend_id)
			response = send_notification(user_id, friend_id, 'You have a friendship request', 'friend_request', f'{user_id}')
			if not 199 < response['status_code'] < 299:
				raise Exception(f'Error sending notification: {response.text}')
			return True, None
		

# Simply validates the friend_id
@staticmethod
def validate_friend_id(friend_id):
	if friend_id is None:
		return False, 'friend_id is required'
	try:
		friend_id = int(friend_id)
	except ValueError:
		raise ValueError("friend_id must be convertible to an integer")
	try:
		CustomUser.objects.get(id=friend_id)
	except CustomUser.DoesNotExist:
		return False, 'friend_id not found'
	return True, None
		
  
  
# Send a notification to frontend endpoint to notify the user of a friend request  
@staticmethod
def send_notification(user_id, friend_id, subject, type, data):
	user = CustomUser.objects.get(id=user_id)
	notification = {
		'subject': f'{subject} from {user_id} {user_id}',
		'type': type,   
		'user_list': [friend_id],
		'data': data,
	}    
	try:
		# TO DO : CONNECT TO NOTIFICATION SERVICE(SEND NOTIFICATION)
		#response = SendInternalRequest.post(url='http://localhost:8000/api/v1/notifications/', data = json.dumps(notification))
		print ('Notification kinda was send ), 200')
		response = {'message': 'Notification kinda was send )))', 'status_code': 200}
	except Exception as e:
		raise Exception(f'Error sending notification: {e}')
	if not (199 < response['status_code'] < 300):
		raise Exception(f"Error sending notification: {response['message']}")
	return response

	


# Shows list of friends for a user
class ShowAllFriendsView(APIView):
	@staticmethod
	def get(request):
		user_id = request.user.id
		try:
			friends = Friend.objects.filter(user_id=user_id)
		except Exception as e:
			return Response(data={'error': str(e)}, status=500)

		friend_list = []
		for friend in friends:
			try:
				user_profile = UserProfile.objects.get(user_id=friend.friend_id)
				user_profile_data = UserProfileSerializer(user_profile).data
				if friend.status == Friend.ACCEPTED:
					status = 'accepted'
				elif friend.status == Friend.PENDING:
					status = 'pending'
				elif friend.status == Friend.BLOCKED:
					status = 'blocked'
				friend_data = {

					"UserProfile": user_profile_data,
					"Status": {
						"status": status
					}
				}
				friend_list.append(friend_data)
			except UserProfile.DoesNotExist:
				continue  # or handle the case where the user profile does not exist

		return Response(data=friend_list, status=200)

# ------------------------------------------- accept & decline views -----------------------------------------------

class FriendAcceptView(APIView):
	@staticmethod
	def post(request):
		user_id = request.user.id
		friend_id = request.data.get('friend_id')
		# if friend_id is not None:
		# 	friend_id = int(friend_id)
		# else:
		# 	return Response(data = {'error': 'friend_id is required'}, status=400)
		valid, error = validate_friend_id(friend_id)
		if not valid:
			return Response(data = {'error': error}, status=400)
		try:
			backward_friendship = Friend.objects.get(user_id=friend_id, friend_id=user_id)
		except Friend.DoesNotExist :
				return Response(data = {'error': 'no friend request'}, status=400)
		if backward_friendship.status == Friend.ACCEPTED:
			return Response(data = {'error': 'we are already friends'}, status=400)
		elif backward_friendship.status == Friend.BLOCKED:
			return Response(data = {'error': 'friend is blocked'}, status=400)
		else:
			backward_friendship.status = Friend.ACCEPTED
			backward_friendship.save()
			try:
				forward_friendship = Friend.objects.get(user_id=user_id, friend_id=friend_id)
			except Friend.DoesNotExist:
				forward_friendship = Friend.objects.create(user_id=user_id, friend_id=friend_id, status=Friend.ACCEPTED)
			
			forward_friendship.status = Friend.ACCEPTED
			forward_friendship.save()
			try:
				send_notification(user_id, friend_id, f'Friendship request has been accepted', 'accept_friendship_request', f'{user_id}')
			except Exception as e:
				return Response(data = {'error': str(e)}, status=500)

		return Response(data = {'message': 'friend has been request accepted'}, status=200)
			
   
   
class FriendDeclineView(APIView):
	@staticmethod
	def post(request):
		user_id = request.user.id
		friend_id = request.data.get('friend_id')
		# if friend_id is not None:
		# 	friend_id = int(friend_id)
		# else:
		# 	return Response(data = {'error': 'friend_id is required'}, status=400)
		valid, error = validate_friend_id(friend_id)
		if not valid:
			return Response(data = {'error': error}, status=400)
		try:
			backward_friendship = Friend.objects.get(user_id=friend_id, friend_id=user_id)
		except Friend.DoesNotExist :
			return Response(data = {'error': 'no friend request'}, status=400)
		if backward_friendship.status == Friend.ACCEPTED:
			return Response(data = {'error': 'we are already friends'}, status=400)
		elif backward_friendship.status == Friend.BLOCKED:
			return Response(data = {'error': 'friend is blocked'}, status=400)
		else:
			backward_friendship.delete()
		send_notification(user_id, friend_id, f'Friendship request has been declined ', 'decline_friendship_request', f'{user_id}')
		return Response(data = {'message': 'friend request declined'}, status=200)

# ----------------------------------------------------------------------------------------------------------------



# Service method that shows all relationships in table between users. Should be removed in production.
@permission_classes([AllowAny])
class FriendShowAllView(APIView):
	@staticmethod
	def get(request):
		#user_id = request.user.id
		try:
			friends = Friend.objects.all()
		except Exception as e:
			return Response(data = {'error': str(e)}, status=500) 
		i = 0
  
		friend_list = {
					'friends':
						[
							{
								f"#{i+1}: user:' '{friend.user.id}', 'friend:' '{friend.friend.id}', 'status': {'accepted' if friend.status == Friend.ACCEPTED else ('pending' if friend.status == Friend.PENDING else 'blocked' )}",                 
							} for  friend in friends
						]
					}
		return Response(data = friend_list, status=200)	




# @permission_classes([AllowAny])
# class LoopbackNotification(APIView):
# 	def post(request):
# 		data = request.data
# 		return Response(data = {'message': 'notification received'}, status=200)
