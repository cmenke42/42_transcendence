
from django.contrib import admin
from django.urls import path, include

from users.views import CustomUserApiList, CustomUserApiUpdate, CustomUserApiDelete, CustomUserProfileViewSet
from people.views import *
from people.views.sign_up import SignUpView
from people.views.deactivate_account import DeactivateAccountView
from people.views.sign_up import VerifyUserEmailView
from people.views.password_recovery import PasswordRecovery, VerifyResetPasswordEmailView
from people.views.password_recovery import SetNewPasswordAfterReset
from people.views.oauth2 import *


urlpatterns = [ 
    path('admin/',      admin.site.urls),                                      					# Django admin panel
    path('api/v1/user/', CustomUserApiList.as_view()),                         					# List all users
    path('api/v1/user/<int:pk>/',       CustomUserApiUpdate.as_view()),        					# Show a user
    path('api/v1/user/<int:pk>/profile/', CustomUserProfileViewSet.as_view(), name='user profile page'), 					# Show a user profile   
    path('api/v1/deactivate_user/<int:pk>/', DeactivateAccountView.as_view()), 					# Deactivate account
    path('api/v1/user/delete/<int:pk>/', CustomUserApiDelete.as_view()),       					# Delete a user
    path('', SignUpView),                              											# Sign up
    path('api/v1/verify_my_email/<str:user_id>/<str:token>/', VerifyUserEmailView.as_view()), 	# Verify signup email    
    path('api/v1/reset_password/<str:user_id>/',                                                # Request to reset forgotten password
         PasswordRecovery.as_view(), name='password_recovery'), 
    path('api/v1/reset_password/<str:user_id>/<str:token>/',                                    # Verify forgot password email link
         VerifyResetPasswordEmailView.as_view()),	
    path('api/v1/change_forgotten_password/<str:user_id>/<str:token>/',                         # Set new password after reset
         SetNewPasswordAfterReset.as_view(), name='change_forgotten_password'),	
    
    path('api/v1/oauth_login/', FortyTwoIntraLogin, name='oauth_login'),               	 # 42 Intra login
	path('api/v1/call_back/',													 # 42 Intra login callback
		FortyTwoIntraLoginCallback, name='oauth_callback'),                    
    
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('api/v1/signup/', SignUpView, name='signup'),
    path('api/v1/', include('user_login.urls')),
    
]   
