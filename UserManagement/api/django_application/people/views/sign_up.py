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
from people.utils import is_valid_email, is_valid_password
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils.http import urlsafe_base64_encode
from datetime import datetime, timedelta
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_decode
from django.utils import timezone
from django.conf import settings


@staticmethod
def send_verif_email(user, subject):
	token = default_token_generator.make_token(user)
	user.email_verif_token = token
	user_id = urlsafe_base64_encode(str(user.id).encode())
	user.email_verif_token_expires = timezone.now() + timedelta(hours=24)
	if (subject == 'Pong. E-mail verification'):
		token_string = f'http://localhost:8000/api/v1/verify_my_email/{user_id}/{token}/'
		body = settings.EMAIL_BODY_VERIFICATION
	if (subject == 'Pong. E-mail password recovery'):
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


@method_decorator(csrf_exempt, name='dispatch')
class VerifyUserEmailView(APIView):
	permission_classes = [AllowAny]
	@csrf_exempt
	
	def get(self, request, user_id, token):
		try:
			decoded_user_id = urlsafe_base64_decode(user_id).decode()
			print (request)
			print (decoded_user_id)
			print (token)
			user = CustomUser.objects.get(pk=decoded_user_id)
		except CustomUser.DoesNotExist:
			return Response(data={'errors': ['User does not exist']}, status=404)
		except Exception as e:
			return Response(data={'errors': [f'Error verifying email: {e}']}, status=500)

		if user.is_email_verified:
			return Response(data={'message': 'Email is already verified'}, status=200)
		print("send mail token expires", user.email_verif_token_expires)
		print("datetime now", timezone.now())
		if user.email_verif_token_expires < timezone.now():
			return Response(data={'errors': ['Token expired']}, status=400)
		if not default_token_generator.check_token(user, token):
			return Response(data={'errors': ['Invalid token']}, status=400)
		user.is_email_verified = True
		user.is_active = True
		user.email_verif_token = ""
		user.email_verif_token_expires = None
		user.save()
#should we generate a token JWT here?
		return Response(data={'message': 'User\'s email has been verified'}, status=200)


from rest_framework.decorators import api_view, permission_classes
from django.db import IntegrityError
from rest_framework import status
from users.serializers import UserRegisterSerializer

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
		return Response(data={'errors': [f'Error creating the user: can\'t verify email {e}']}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	return Response(data={'message': 'User was successfully created'}, status=201)
		

# from rest_framework.generics import CreateAPIView
# from rest_framework.response import Response
# from rest_framework import status

# class SignUpView(CreateAPIView):
# 	serializer_class = CustomUserSerializer
# 	permission_classes = [AllowAny] # for testing purposes
	
# 	def perform_create(self, serializer):
# 		self.created_user = serializer.save()

# 	# def create(self, request, *args, **kwargs):
# 	#     serializer = self.get_serializer(data=request.data)
# 	#     serializer.is_valid(raise_exception=True)
# 	#     user = serializer.save() # This will call `create` method of the serializer
	
# 	def send_mail(self):
# 		try:
# 			send_verif_email(self.created_user, 'Pong. E-mail verification')
# 		except Exception as e:
# 			self.created_user.delete()
# 			return Response(data={'errors': [f'Error creating the user: can\'t verify email {e}']}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 	# return Response(data={'message': 'User was successfully created'}, status=status.HTTP_201_CREATED)


# @method_decorator(csrf_exempt, name='dispatch')
# class SignUpView(APIView):
#     permission_classes = [AllowAny] # for testing purposes
#     @csrf_exempt
	
#     def post(self, request):
#         try:
#             serializer = CustomUserSerializer(data=json.loads(request.body.decode('utf-8')))
#             serializer.is_valid(raise_exception=True)
#             validated_data = serializer.validated_data
#         except serializers.ValidationError as e:
#             return Response(data={'errors': [f'Error creating the user - serializer can\'t deserialize data : {e}']},
#                             status=400)
#         # # Validate the data
#         # error = self.validate_data(validated_data)
#         # if error:
#         #     return Response(data={'errors': error}, status=400)        
		
#         # try:
#         user = CustomUser.objects.create(email=validated_data['email'],
#                                              password=make_password(validated_data['password']))
#         # except Exception as e:
#         #     if user:
#         #         user.delete()
#         #     return Response(data={'errors': [f'Error creating the user: can\'t create user {e}']}, status=500)

#         try:
#             ## Debug Check if the password is correct
#             # if user.check_password(validated_data['password']):
#             #     print('password is ok', {user.password})
#             # else:                
#             #     print('password is not ok', {user.password})                
#             send_verif_email(user, 'Pong. E-mail verification')
#         except Exception as e:
#             user.delete()
#             return Response(data={'errors': [f'Error creating the user: can\'t verify email {e}']}, status=500)   
		
#         try:
#             user.save()
#             return Response(data={'message': 'User was sucessfully created'}, status=201)
#         except Exception as e:
#             user.delete()
#             return Response(data={'errors': [f'Error creating the user : {e}']}, status=500)
		
		
	# #Validation method
	# def validate_data(self, data):
	#     list_of_errors = []
	
	#     # if not is_valid_email(data['email']):
	#     #     list_of_errors.append('Invalid email')
	#     # if not is_valid_username(data['username']):
	#     #     list_of_errors.append('Invalid username')
	#     if not is_valid_password(data['password']):
	#         list_of_errors.append('Invalid password')
		
	#     return list_of_errors
