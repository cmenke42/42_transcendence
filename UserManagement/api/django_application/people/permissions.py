from rest_framework import permissions

#from rest_framework.permissions import IsAdminUser
# class IsAdminOrReadOnly(permissions.BasePermission):
#     def has_permission(self, request, view):
#         if request.method in permissions.SAFE_METHODS:
#             return True        
#         return bool(request.user and request.user.is_staff)
	

# class IsOwnerOrAdminOnly(permissions.BasePermission):
#     def has_object_permission(self, request, view, obj):
#         if (request.user.is_authenticated):
#             return request.user.is_staff or obj == request.user
		

class IsOwnerOrAdminOnly(permissions.BasePermission):
	def has_permission(self, request, view):
		return request.user.is_authenticated
	
	def has_object_permission(self, request, view, obj):
		if request.user.is_authenticated:
			return request.user.is_staff or obj == request.user
		return False



# class IsOwnerOrReadOnly(permissions.BasePermission):
# 	"""
# 	Custom permission to only allow owners of an object to edit it.
# 	"""
# 	def has_permission(self, request, view):
# 		return request.user.is_authenticated
	
# 	def has_object_permission(self, request, view, obj):
# 		# Read permissions are allowed to any request,
# 		# so we'll always allow GET, HEAD or OPTIONS requests.
# 		if request.method in permissions.SAFE_METHODS:
# 			return True
# 		# Write permissions are only allowed to the owner of the snippet.
# 		return obj.user == request.user