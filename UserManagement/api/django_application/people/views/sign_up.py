import json
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.tokens import default_token_generator
from users.models import CustomUser
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils.http import urlsafe_base64_encode
from datetime import datetime, timedelta
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_decode
from django.utils import timezone
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from django.db import IntegrityError
from rest_framework import status
from users.serializers import UserRegisterSerializer


# 2. sends e-mail to user with verification token for registration or password recovery
@staticmethod
def send_verif_email(user, subject):
	token = default_token_generator.make_token(user)
	user.email_verif_token = token
	user_id = urlsafe_base64_encode(str(user.id).encode())
	if (subject == 'Pong. E-mail verification'):
		user.email_verif_token_expires = timezone.now() + timedelta(hours=24)
		token_string = f'http://localhost:8000/api/v1/verify_my_email/{user_id}/{token}/'
		body = settings.EMAIL_BODY_VERIFICATION
	if (subject == 'Pong. E-mail password recovery'):
		user.user_recovery_code_expires = timezone.now() + timedelta(hours=1)
		token_string = f'http://localhost:8000/api/v1/reset_password/{user_id}/{token}/'
		body = settings.EMAIL_BODY_FORGOT_PASSWORD
	message = f'''Hello user, {body}, \n\n{token_string}
	\n\nIf you did not request this, please ignore this email. 
	\n\nThanks,\nYour Pong team
	'''
	receiver = [user.email]
	try:
		send_mail(subject, message, 'EMAIL_HOST_USER', receiver)
	except Exception as e:
		raise e
	user.save()


# 3. verifies user's email and activates the account during registration
@method_decorator(csrf_exempt, name='dispatch')
class VerifyUserEmailView(APIView):
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

		if user.is_email_verified:
			return Response(data={'message': 'Email is already verified'}, status=200)
		print("send mail token expires", user.email_verif_token_expires)
		print("datetime now", timezone.now())
		if user.email_verif_token_expires  == None or user.email_verif_token_expires < timezone.now(): ##changed
			return Response(data={'errors': ['Token expired']}, status=400)
		if not default_token_generator.check_token(user, token):
			return Response(data={'errors': ['Invalid token']}, status=400)
		user.is_email_verified = True
		user.is_active = True
		user.email_verif_token = ""
		user.email_verif_token_expires = None
		user.save()
		return Response(data={'message': 'User\'s email has been verified'}, status=200)


# 1. registers a new user
@api_view(['POST'])
@permission_classes([AllowAny])
def SignUpView(request):
	""""
	API endpoint for user registration.
	"""
	# serializer = CustomUserSerializer(data=request.data)
	serializer = UserRegisterSerializer(data=request.data)
	try:
		serializer.is_valid(raise_exception=True)
		user = serializer.save()
	except IntegrityError as e:
		return Response(data={'errors': e.detail}, status=status.HTTP_400_BAD_REQUEST)
 
	try:
		send_verif_email(user, 'Pong. E-mail verification')
	except Exception as e:
		return Response(data={'errors': [f'Error creating the user: can\'t send verification email {e}']}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	return Response(data={'message': 'User was successfully created'}, status=201)
	
