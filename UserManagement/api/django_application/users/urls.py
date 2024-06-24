from django.urls import path
from .views.user_account import UserAccountViewSet, ActivateAccountAPIView
from .views.password_reset import ResetPasswordAPIView, ForgotPasswordAPIView
from .views.change_password import ChangePasswordAPIView
from .views.change_email import ChangeEmailAPIView, ObtainChangeEmailTokenAPIView
from .views.friendship_view import FriendViewSet, FriendAcceptView, FriendDeclineView, FriendShowAllView, ShowAllFriendsView
from django.urls import path, include
from rest_framework.routers import DefaultRouter

def register_with_router(router):
	"""
	Register the UserAccountViewSet with the given router.
	"""
	router.register(r'users', UserAccountViewSet, basename='user')
	router.register(r'friends', FriendViewSet, basename='friend')

router = DefaultRouter()

router.register(r'friends', FriendViewSet, basename='friend')

urlpatterns = [
    
# GET	http://localhost:8000/api/v1/friends/status/?friend_id=2	shows relationship status between friend with user_id=2 and user
# POST	http://localhost:8000/api/v1/friends/request/?friend_id=3	sends friend request to user with id=3
# DEL	http://localhost:8000/api/v1/friends/remove/?friend_id=2	delete friendship between friend with user_id=2 and user

	path('friends/', FriendViewSet.as_view({'get': 'get', 'post': 'post', 'delete': 'delete'}), name='friends'),
	path('activate/', ActivateAccountAPIView.as_view(), name='user-activate'),
	path('forgot-password/', ForgotPasswordAPIView.as_view(), name='user-forgot-password'), 
	path('reset-password/', ResetPasswordAPIView.as_view(), name='user-reset-password'),
	path('change-password/', ChangePasswordAPIView.as_view(), name='user-change-password'),
	path('change-email/get-token/', ObtainChangeEmailTokenAPIView.as_view(), name='user-change-email-get-token'),
	path('change-email/', ChangeEmailAPIView.as_view(), name='user-change-email'),    


#GET http://localhost:8000/api/v1/users/friends/myfriends/							shows all friends of user
	path('friends/myfriends/',  ShowAllFriendsView.as_view(), name='my-friends'),   
#POST http://localhost:8000/api/v1/users/friends/accept/ BODY:{friend_id' = '1'}	accept friend request from id_1:
	path('friends/accept/', FriendAcceptView.as_view(), name='friends-accept'),        
#POST http://localhost:8000/api/v1/users/friends/decline/ BODY:{friend_id' = '1'}	decline friend request from id_1:
	path('friends/decline/', FriendDeclineView.as_view(), name='friends-decline'),  
	
# SERVICE METHOD: GET http://localhost:8000/api/v1/users/friends/showall/			shows all relationship in table
	path('friends/showall/', FriendShowAllView.as_view(), name='show-all'),
		
]
