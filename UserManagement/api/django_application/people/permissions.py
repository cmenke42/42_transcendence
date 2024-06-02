from rest_framework import permissions

from rest_framework.permissions import IsAdminUser
# class IsAdminOrReadOnly(permissions.BasePermission):
#     def has_permission(self, request, view):
#         if request.method in permissions.SAFE_METHODS:
#             return True        
#         return bool(request.user and request.user.is_staff)
    

class IsOwnerOrAdminOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if (request.user.is_authenticated):
            return request.user.is_staff or obj == request.user
        
        # if request.user and request.user.is_staff:
        #     return True
        # return obj.owner == request.user


 
# class IsOwnerOrAdminOnly(permissions.BasePermission):
#     def has_object_permission(self, request, view, obj):
#         if request.method in permissions.SAFE_METHODS:
#             return True

#         # Instance must have an attribute named `owner`.
#         return obj.owner == request.user