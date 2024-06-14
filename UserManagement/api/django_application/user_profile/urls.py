from .views import UserProfileViewSet

def register_with_router(router):
    """
    Register the UserAccountViewSet with the given router.
    """
    router.register(r'profiles', UserProfileViewSet, basename='profile')
