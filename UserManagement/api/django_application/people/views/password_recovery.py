import json
from django.contrib.auth.hashers import make_password
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from django.views.decorators.csrf import csrf_exempt
from rest_framework import serializers
from django.contrib.auth.tokens import default_token_generator
from users.models import CustomUser
#from people.serializers import CustomUserSerializer
from users.serializers import CustomUserSerializer
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils.http import urlsafe_base64_encode
from datetime import datetime, timedelta, timezone
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
import random
import string


    
    # token = default_token_generator.make_token(user)
    # user.email_verif_token = token
    # user.email_verif_token_expires = datetime.now() + timedelta(days=1)
    # token_string = f'http://localhost:8000/api/v1/verify_my_email/{user_id}/{token}/'
    # subject = 'Pong email verification'
    # message = f'Hello {user.username},\n\nPlease click on the following link to verify your email:\n\n{token_string}\n\nIf you did not request this, please ignore this email.\n\nThanks,\nYour Pong team'

    # sender = 'putiev@gmail.com'
    # receiver = [user.email]
    # try:
    #     send_mail(subject, message, sender, receiver)
    # except Exception as e:
    #     raise e
	


# @method_decorator(csrf_exempt, name='dispatch')
# class VerifyUserEmailView(APIView):
# 	permission_classes = [AllowAny]
# 	@csrf_exempt
    
# 	def get(self, request, user_id, token):
# 		try:
# 			decoded_user_id = urlsafe_base64_decode(user_id).decode()
# 			print (request)
# 			print (decoded_user_id)
# 			print (token)
# 			user = CustomUser.objects.get(pk=decoded_user_id)
# 		except CustomUser.DoesNotExist:
# 			return Response(data={'errors': ['User does not exist']}, status=404)
# 		except Exception as e:
# 			return Response(data={'errors': [f'Error verifying email: {e}']}, status=500)

# 		if user.is_email_verified:
# 			return Response(data={'message': 'Email is already verified'}, status=200)
# 		if user.email_verif_token_expires < datetime.now(timezone.utc):
# 			return Response(data={'errors': ['Token expired']}, status=400)
# 		if not default_token_generator.check_token(user, token):
# 			return Response(data={'errors': ['Invalid token']}, status=400)
# 		user.is_email_verified = True
# 		user.save()
# #should we generate a token JWT here?
# 		return Response(data={'message': 'User\'s email has been verified'}, status=200)





from .sign_up import send_verif_email



@method_decorator(csrf_exempt, name='dispatch')
class PasswordRecovery(APIView):
    permission_classes = [AllowAny] # for testing purposes
    @csrf_exempt
    
    def post(self, request):
        json_request = request.data  # Define json_request variable and assign it the value of request.data
        try:
            email = json_request['email']
        except serializers.ValidationError as e:
            return Response(data={'errors': [f'Error creating the user - serializer can\'t deserialize data : {e}']},
                            status=400)
        # Validate the data
        # if not is_valid_email(email):
        #     return Response(data={'errors': ['invalid e-mail format']}, status=400)
        try:            
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response(data={'errors': [f'Error user: with that email doesn\'t exist {e}']}, status=400)
        try:
            send_verif_email(user, 'Pong. E-mail password recovery')
        except Exception as e:
            return Response(data={'errors': [f'Error resetting  password: {e}']}, status=500)
        
        
        
        
        
        return Response(data={'message': 'User was sucessfully recovered'}, status=201)
        
        
        
    #     try:
            
    #         user = CustomUser.objects.create(username=validated_data['username'],
    #                                          email=validated_data['email'],
    #                                         password=make_password(validated_data['password']))
    #     except Exception as e:
    #         return Response(data={'errors': [f'Error creating the user: can\'t create user {e}']}, status=500)

    #     try:
    #         send_verif_email(user)
    #     except Exception as e:
    #         user.delete()
    #         return Response(data={'errors': [f'Error creating the user: can\'t verify email {e}']}, status=500)   
        
    #     try:
    #         user.save()
    #         return Response(data={'message': 'User was sucessfully created'}, status=201)
    #     except Exception as e:
    #         user.delete()
    #         return Response(data={'errors': [f'Error creating the user : {e}']}, status=500)
        
        
    # #Validation method
    # def validate_data(self, data):
    #     list_of_errors = []
    
    #     if not is_valid_email(data['email']):
    #         list_of_errors.append('Invalid email')
    #     if not is_valid_username(data['username']):
    #         list_of_errors.append('Invalid username')
    #     if not is_valid_password(data['password']):
    #         list_of_errors.append('Invalid password')
        
    #     return list_of_errors
