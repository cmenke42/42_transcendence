from users.models import CustomUser
from rest_framework.permissions import BasePermission

class IsSuperUser(BasePermission):
    message = "Only superusers are allowed"

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)
    
    def has_object_permission(self, request, view, obj):
        return bool(request.user and request.user.is_superuser)

class IsUserSelf(BasePermission):
    """
    Custom permission to only allow users to view or edit their own user object.
    """
    message = "You are not the owner of this user object"

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        return (obj == request.user)

class IsIntraUser(BasePermission):
    """
    Custom permission to check if the user signed up with 42 intra
    """
    message = "Only intra users are allowed"

    def has_permission(self, request, view):
        if isinstance(request.user, CustomUser):
            return bool(request.user.is_authenticated and request.user.is_intra_user)
        return False

class NotIntraUser(BasePermission):
    """
    Custom permission to check if the user did not sign up with 42 intra
    """
    message = "Only non-intra users are allowed"

    def has_permission(self, request, view):
        if isinstance(request.user, CustomUser):
            return bool(request.user.is_authenticated and not request.user.is_intra_user)
        return True
