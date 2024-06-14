from django.shortcuts import render

# Create your views here.
from rest_framework import generics, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, IsAdminUser
from django.shortcuts import render

# Create your views here.
from users.serializers import CustomUserSerializer, UserProfileSerializer
#from people.models import Person, UserProfile
from users.models import CustomUser
from django.forms.models import model_to_dict
from people.permissions import IsOwnerOrAdminOnly
from rest_framework.permissions import AllowAny

from user_profile.models import UserProfile

# to show user's status: online, offline, away e t c
# class CustomUserProfileViewSet(viewsets.ModelViewSet):
#     queryset = UserProfile.objects.all()
class CustomUserProfileViewSet(generics.RetrieveAPIView):
    #permission_classes = [IsAuthenticated]
    # permission_classes = [AllowAny] # for testing purposes
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    lookup_field = 'person__id'
    
    def retrieve(self, request, pk=None):
        try:
            userprofile = UserProfile.objects.get(pk=pk)
            serializer = UserProfileSerializer(userprofile)
            return Response(serializer.data)
        except:            
            return Response({'error': 'UserProfile does not exist!!'}, status=404)


class CustomUserApiList(generics.ListCreateAPIView):
    permission_classes = [IsOwnerOrAdminOnly]
    # permission_classes = [IsAdminUser]
    # permission_classes = [AllowAny] # for testing purposes
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer

class CustomUserApiUpdate(generics.RetrieveUpdateAPIView):
    #permission_classes = [IsOwnerOrAdminOnly]
    #permission_classes = [AllowAny] # for testing purposes
    permission_classes = [IsOwnerOrAdminOnly]
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    
class CustomUserApiDelete(generics.RetrieveDestroyAPIView):
    permission_classes = [IsOwnerOrAdminOnly]
    # permission_classes = [AllowAny] # for testing purposes
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    

    
# class PersonApiDetailView(generics.RetrieveUpdateDestroyAPIView):
#     queryset = Person.objects.all()
#     serializer_class = PersonSerializer
    
# class PersonApiView(APIView):
#     def get(self, request):
#         w = Person.objects.all()
#         return Response({'posts': PersonSerializer(w, many=True).data})
    
#     def post(self, request):
#         serializer = PersonSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
#         serializer.save()
        
#         return Response({'post': serializer.data})
        
        # post_new = Person.objects.create(
        #     title=request.data['title'],
        #     content=request.data['content'],
        #     cat_id=request.data['cat_id'])        
        #return Response({'post': PersonSerializer(post_new).data})
    
    # def put (self, request, *args, **kwargs):
    #     pk = kwargs.get('pk', None)
    #     if not pk:
    #         return Response({'error': 'missing id'})
        
    #     try:
    #         instance = Person.objects.get(pk=pk)
    #     except:
    #         return Response({'error': 'not found'})
    #     serializer = PersonSerializer(data = request.data, instance=instance)
    #     serializer.is_valid(raise_exception=True)
    #     serializer.save()
    #     return Response({'post': serializer.data})
    
    # def delete(self, request, *args, **kwargs):
    #     pk = kwargs.get('pk', None)
    #     if not pk:
    #         return Response({'error': 'missing id'})
        
    #     try:
    #         instance = Person.objects.get(pk=pk)
    #     except:
    #         return Response({'error': 'not found'})
    #     instance.delete()
    #     return Response({'success': 'deleted'})


# class PersonApiView(generics.ListAPIView):
#     queryset = Person.objects.all()
#     serializer_class = PersonSerializer






# class PersonViewSet(viewsets.ModelViewSet):
#     queryset = Person.objects.all()
#     serializer_class = PersonSerializer

#     def retrieve(self, request, pk=None):
#         try:
#             user = Person.objects.get(pk=pk)
#             serializer = PersonSerializer(user)
#             return Response(serializer.data)
#         except:
#             return Response({'error': 'User does not exist!!'}, status=404)
#     # def get_queryset(self):
#     #     pk = self.kwargs.get("pk")
#     #     if not pk:
#     #         return Person.objects.all()
#     #     return Person.objects.filter(pk=pk)    
    
#     # @action(methods=['get', 'put', 'delete'], detail=True)
#     # def profile(self, request, pk=None):
#     #     userprofile = UserProfile.objects.get(person_id=pk)
#     #     if request.method == 'PUT':
#     #         serializer = UserProfileSerializer(userprofile, data=request.data)
#     #         if serializer.is_valid():
#     #             serializer.save()
#     #             return Response(serializer.data)
#     #         return Response(serializer.errors, status=400)
#     #     serializer = UserProfileSerializer(userprofile)
#     #     return Response(serializer.data)
    
#     # @action(methods=['get'], detail=True)
#     # def profile(self, request, pk=None):
#     #     profile = UserProfile.objects.get(pk=pk)
#     #     return Response({'userprofile': userprofile.title})
#     #     return Response({'cats': [c.title for c in cats]})
