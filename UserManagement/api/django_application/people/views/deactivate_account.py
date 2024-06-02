import json
from django.http import JsonResponse
from rest_framework.views import APIView
from users.models import CustomUser
from django.views.decorators.csrf import csrf_exempt
from rest_framework.authentication import BaseAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
class DeactivateAccountView(APIView):

    authentication_classes = [] 
    #permission_classes = [IsAuthenticated] 
    permission_classes = [AllowAny]
    @csrf_exempt
    def put(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk)
        except Exception as e:
            return Response(data={'errors': [f'User not found: {e}']}, status=404)
        
        if request.user == user or request.user.is_staff:
        #if user: ##this is just for testing        
            user.is_active = False
            user.save()
            return Response(data={'message': 'User was sucessfully deactivated'}, status=200)
        else:
            return Response(data={'errors': [f'You are not authorized to deactivate this account']}, status=403)
