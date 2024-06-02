
from django.contrib import admin
from django.urls import path, include
from people.views import *
#from rest_framework import routers

from users.views import CustomUserApiList, CustomUserApiUpdate, CustomUserApiDelete, CustomUserProfileViewSet
from people.views.sign_up import SignUpView
from people.views.deactivate_account import DeactivateAccountView
from people.views.sign_up import VerifyUserEmailView
from people.views.password_recovery import PasswordRecovery
#from people.views.sign_in import SignInView

# router = routers.SimpleRouter()
# #router = routers.DefaultRouter()
# router.register(r'user', PersonViewSet, basename='person')


urlpatterns = [ 
    path('admin/',      admin.site.urls),                                      # Django admin panel
    path('api/v1/user/', CustomUserApiList.as_view()),                         # List all users
    path('api/v1/user/<int:pk>/',       CustomUserApiUpdate.as_view()),        # Show a user
    path('api/v1/user/<int:pk>/profile/', CustomUserProfileViewSet.as_view()), # Show a user profile   
    path('api/v1/deactivate_user/<int:pk>/', DeactivateAccountView.as_view()), # Deactivate account
    path('api/v1/user/delete/<int:pk>/', CustomUserApiDelete.as_view()),       # Delete a user
    # path('api/v1/signup/', SignUpView.as_view()),                              # Sign up
    path('api/v1/verify_my_email/<str:user_id>/<str:token>/',                  # Verify signup email         
                                            VerifyUserEmailView.as_view()),
    path('api/v1/forgot_password/', PasswordRecovery.as_view()),           	   # Forgot password
    path('api/v1/reset_password/<str:user_id>/<str:token>/',                   # Verify forgot password email         
                                            VerifyUserEmailView.as_view()),
    
    
    
    #path('api/v1/sgnin/', SignInView.as_view()),                               # Sign in
    
    

    #path('api/v1/', include(router.urls)),
    #path('api/v1/personlist/', PersonViewSet.as_view({'get': 'list'})),
    #path('api/v1/personlist/<int:pk>', PersonApiUpdate.as_view()),
    #path('api/v1/personlist/<int:pk>/', PersonViewSet.as_view({'put': 'update'})),
    #path('api/v1/persondetail/<int:pk>', PersonApiDetailView.as_view()),

    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('api/v1/signup/', SignUpView, name='signup'),
    path('api/v1/', include('user_login.urls')),
]   
