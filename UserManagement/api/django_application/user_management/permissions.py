from rest_framework.permissions import BasePermission, IsAuthenticated


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
