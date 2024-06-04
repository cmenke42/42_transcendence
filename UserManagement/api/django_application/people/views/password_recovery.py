
from django.db import IntegrityError
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.utils import timezone
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.hashers import make_password
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.hashers import make_password
from django.contrib.auth.hashers import make_password

from rest_framework.views import APIView
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from users.models import CustomUser
from .sign_up import send_verif_email
from users.serializers import SetNewPasswordSerializer




# 2. Verifies the email of the user who requested a password reset
@method_decorator(csrf_exempt, name='dispatch')
class VerifyResetPasswordEmailView(APIView):
	permission_classes = [AllowAny]
	@csrf_exempt
	
	def get(self, request, user_id, token):
		try:
			decoded_user_id = urlsafe_base64_decode(user_id).decode()
			user = CustomUser.objects.get(pk=decoded_user_id)
		except CustomUser.DoesNotExist:
			return Response(data={'errors': ['User does not exist']}, status=404)
		except Exception as e:
			return Response(data={'errors': [f'Error verifying email: {e}']}, status=500)

		if not user.is_email_verified:
			return Response(data={'message': 'Email is not verified yet. Please verify your e-mail address first'}, status=200)
		print("send mail token expires", user.email_verif_token_expires)
		print("datetime now", timezone.now())
		if user.user_recovery_code_expires == None or user.user_recovery_code_expires < timezone.now() :
			return Response(data={'errors': ['Recovery link expired']}, status=400)
		if not default_token_generator.check_token(user, token):
			return Response(data={'errors': ['Invalid recovery link']}, status=400)
		user.user_recovery_code = ""
		user.user_recovery_code_expires = None
		user.reset_password_link_accepted = True
		user.save()
		return Response(data={'message': 'User\'s email has been verified during password reset procedure'}, status=200)


	
3. #Sets a new password for the user who requested a password reset
@method_decorator(csrf_exempt, name='dispatch')
class SetNewPasswordAfterReset(APIView):
	permission_classes = [AllowAny]
	@csrf_exempt
	def post(self, request, user_id, token):

		try:
			decoded_user_id = urlsafe_base64_decode(user_id).decode()
			user = CustomUser.objects.get(pk=decoded_user_id)
		except CustomUser.DoesNotExist:
			return Response(data={'errors': ['User with that id does not exist']}, status=404)
		except Exception as e:
			return Response(data={'errors': [f'Error during reset password: {e}']}, status=500)
		serializer = SetNewPasswordSerializer(data=request.data)
		try:
			serializer.is_valid(raise_exception=True)
		except IntegrityError as e:
			return Response(data={'errors': e.detail}, status=status.HTTP_400_BAD_REQUEST)	

		new_password = serializer.validated_data['new_password']
		user.password = make_password(new_password)
		user.user_recovery_code = ''
		user.user_recovery_code_expires = None
		user.reset_password_link_accepted = False
		user.save()
		return Response({"message": "Password changed successfully"}, status=status.HTTP_200_OK)


# 1. Sends an email to the user with a link to reset the password
@method_decorator(csrf_exempt, name='dispatch')
class PasswordRecovery(APIView):
	permission_classes = [AllowAny] # for testing purposes
	@csrf_exempt
	
	def post(self, request, user_id):
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
		return Response(data={'message': 'Verification email was sucessfully send'}, status=201)
		
	