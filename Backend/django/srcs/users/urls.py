from django.urls import path
from .views.user_account import UserAccountViewSet, ActivateAccountAPIView
from .views.password_reset import ResetPasswordAPIView, ForgotPasswordAPIView
from .views.change_password import ChangePasswordAPIView
from .views.change_email import ChangeEmailAPIView, ObtainChangeEmailTokenAPIView
from .views.friendship_view import FriendViewSet, FriendAcceptView, FriendDeclineView, FriendShowAllView, ShowAllFriendsView
from .views.blocklist import BlockListAddView, BlockListRemoveView, BlockListView
from django.urls import path, include
from .views.game_invitation import GameInvitationView, RespondGameInvitation, CheckGameInvitation
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
# router.register(r'users', UserAccountViewSet, basename='user')
# router.register(r'friends', FriendViewSet, basename='friend')

def register_with_router(router):
	"""
	Register the UserAccountViewSet with the given router.
	"""
	router.register(r'users', UserAccountViewSet, basename='user')
	router.register(r'friends', FriendViewSet, basename='friend')

urlpatterns = [
	
# GET	http://localhost:8000/api/v1/friends/status/?friend_id=2	shows relationship status between friend with user_id=2 and user
# POST	http://localhost:8000/api/v1/friends/request/?friend_id=3	sends friend request to user with id=3
# DEL	http://localhost:8000/api/v1/friends/remove/?friend_id=2	delete friendship between friend with user_id=2 and user

	#path('friends/', FriendViewSet.as_view({'get': 'get', 'post': 'post', 'delete': 'delete'}), name='friends'),
	path('activate/', ActivateAccountAPIView.as_view(), name='user-activate'),
	path('forgot-password/', ForgotPasswordAPIView.as_view(), name='user-forgot-password'), 
	path('reset-password/', ResetPasswordAPIView.as_view(), name='user-reset-password'),
	path('change-password/', ChangePasswordAPIView.as_view(), name='user-change-password'),
	path('change-email/get-token/', ObtainChangeEmailTokenAPIView.as_view(), name='user-change-email-get-token'),
	path('change-email/', ChangeEmailAPIView.as_view(), name='user-change-email'),
 
	#path('', include(router.urls)),
	

# POST	http://localhost:8000/api/v1/friends/request/?friend_id=3	sends friend request to user with id=3

#GET http://localhost:8000/api/v1/users/friends/myfriends/							shows all friends of user
	path('friends/myfriends/',  ShowAllFriendsView.as_view(), name='my-friends'),
#POST http://localhost:8000/api/v1/users/friends/accept/ BODY:{friend_id' = '1'}	accept friend request from id_1:
	path('friends/accept/', FriendAcceptView.as_view(), name='friends-accept'),        
#POST http://localhost:8000/api/v1/users/friends/decline/ BODY:{friend_id' = '1'}	decline friend request from id_1:
	path('friends/decline/', FriendDeclineView.as_view(), name='friends-decline'),  
	
#PATCH http://localhost:8000/api/v1/users/blocklist/add/?blocked_id=2 				adds friend with id_1 to blocklist
	path('blocklist/add/', BlockListAddView.as_view(), name='blocklist-add'),
#PATCH http://localhost:8000/api/v1/users/blocklist/remove/?blocked_id=2 			removes friend with id_1 from blocklist
	path('blocklist/remove/', BlockListRemoveView.as_view(), name='blocklist-remove'),
# GET http://localhost:8000/api/v1/users/blocklist/									shows all blocked friends
	path('blocklist/all/', BlockListView.as_view(), name='blocklist'),
 
 
#Not for Production so don't user this
# SERVICE METHOD: GET http://localhost:8000/api/v1/users/friends/showall/			shows all relationship in table
	path('friends/showall/', FriendShowAllView.as_view(), name='show-all'),

# GET Testing phase
#for game invitation & accept
# POST http://localhost:8000/api/v1/users/invite/				invite friend with id_2
	path('game/invite/', GameInvitationView.as_view(), name='invite'),
#POST Rquets to accept/reject the invitation
	path('game/respond/', RespondGameInvitation.as_view(), name='respond'),
#GET request to show all invitations: http://localhost:8000/api/v1/users/game/invitation/

	path('game/invitation/', CheckGameInvitation.as_view(), name='invitation'),

]

""" 	path('invite/', GameInvitation.as_view(), name='invite'),
# POST http://localhost:8000/api/v1/users/respond/?invitation_id=2&action=accept	accept invitation with id_2
	path('respond/', RespondGameInvitation.as_view(), name='respond'), """