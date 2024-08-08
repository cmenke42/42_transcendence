from django.urls import path
from .views import UserProfileViewSet, UserListView

def register_with_router(router):
    """
    Register the UserAccountViewSet with the given router.
    """
    router.register(r'profiles', UserProfileViewSet, basename='userprofile')

urlpatterns = [
    # Add this line for the UserListView
    path('list/', UserListView.as_view(), name='user-list'),
]