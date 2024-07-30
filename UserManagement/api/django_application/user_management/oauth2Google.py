import os
import string
import secrets
import random
import requests
import uuid

from django.http import JsonResponse
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import IntegrityError
from django.contrib.auth.hashers import make_password
from django.shortcuts import redirect
from django.core.cache import cache

from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from rest_framework.views import APIView

from base64 import urlsafe_b64encode, urlsafe_b64decode
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from urllib.parse import urlencode

from users.models import CustomUser
from user_management.utils import get_env_or_file_value
from users.serializers import UserSerializer
from user_profile.models import UserProfile
from user_management.settings import	GOOGLE_SCOPES, \
										GOOGLE_AUTH_URI, \
				 						GOOGLE_TOKEN_URI , \
										API_42_FRONTEND_CALLBACK_URL , \
										EXCAHNGE_CODE_TIMEOUT, \
              							GOOGLE_USER_INFO_URI, \
										GOOGLE_REDIRECT_URI \




# Check if all required fields are present in the user profile info
def validate_user_profile_info(user_profile_info):
	required_fields = ['email', 'avatar', 'nickname']
	for field in required_fields:
		if field not in user_profile_info or not user_profile_info[field]:
			return False
	return True

# Get AES key from .env file or generate a new one
def get_aes_key():
	aes_key = get_env_or_file_value('AES_KEY')
	if aes_key is None:
		raise ValueError('No AES key found. needed for oauth2')
	else:
		aes_key = bytes.fromhex(aes_key)
	return aes_key

# Encrypt and decrypt query parameters
def encrypt_query_param(param_value):
	key = get_aes_key()
	aesgcm = AESGCM(key)
	nonce = os.urandom(12)
	encrypted_data = aesgcm.encrypt(nonce, param_value, None)
	encrypted_param = urlsafe_b64encode(nonce + encrypted_data).decode()
	return encrypted_param
	
# Decrypt query parameter
def decrypt_query_param(encrypted_param):
	try:
		key = get_aes_key()
		encrypted_bytes = urlsafe_b64decode(encrypted_param.encode())
		nonce = encrypted_bytes[:12]
		encrypted_data = encrypted_bytes[12:]
		aesgcm = AESGCM(key)
		decrypted_string = aesgcm.decrypt(nonce, encrypted_data, None)
		return True 
	except Exception:
		return False  



# 1.  Google Login request
@csrf_exempt
@require_http_methods(["GET"])
@permission_classes([AllowAny])
def GoogleLogin(request):	   
		
	characters = string.ascii_letters + string.digits    
	uncrypted_state = ''.join(secrets.choice(characters) for _ in range(10))
	byte_string = uncrypted_state.encode()
	encrypted_state = encrypt_query_param(byte_string)
	parameters = {
		'redirect_uri': GOOGLE_REDIRECT_URI,
		'response_type': 'code',
		'client_id': get_env_or_file_value("GOOGLE_CLIENT_ID"),
		'scope': ' '.join(GOOGLE_SCOPES),
		'state': encrypted_state
	} 
	url = f"{GOOGLE_AUTH_URI}?{urlencode(parameters)}"
	return redirect(url)

 
# 2  Google Login callback handling
@csrf_exempt
@require_http_methods(["GET"])
@permission_classes([AllowAny])
def GoogleLoginCallback(request):

	code = request.GET.get('code')
	encrypted_state = request.GET.get('state')

	if not decrypt_query_param(encrypted_state) :
		return JsonResponse({'error': 'State from Google callback cannot be decrypted'}, status=400) 
	if not code:
		return JsonResponse({'error': 'code hasn\'t been received from Google'}, status=400)  
	 
	print('get_env_or_file_value("GOOGLE_CLIENT_ID")', get_env_or_file_value("GOOGLE_CLIENT_ID"))
	print('get_env_or_file_value("GOOGLE_CLIENT_SECRET")', get_env_or_file_value("GOOGLE_CLIENT_SECRET"))
	print('get_env_or_file_value("GOOGLE_REDIRECT_URI")', get_env_or_file_value("GOOGLE_REDIRECT_URI"))
	
	token_request = {
	'client_id'     : get_env_or_file_value("GOOGLE_CLIENT_ID"),
	'client_secret' : get_env_or_file_value("GOOGLE_CLIENT_SECRET"),
	'redirect_uri'  : GOOGLE_REDIRECT_URI,
	'grant_type'    : 'authorization_code',
	'code'          : code,
	'state': encrypted_state,
	}
	response = requests.post(GOOGLE_TOKEN_URI, data=token_request)
	encrypted_state_2 = request.GET.get('state')	
	if not decrypt_query_param(encrypted_state_2) :
		return JsonResponse({'error': 'State from Google callback cannot be decrypted'}, status=400)
	
	if not(200 <= response.status_code < 300):
		return JsonResponse({'error': 'Failed to get access token'}, status=401)
	google_access_token = response.json().get('access_token') 
	user_profile_info = retrieve_google_user_info(google_access_token)
	if not isinstance(user_profile_info, dict) or not validate_user_profile_info(user_profile_info):
		return JsonResponse({'error': 'Invalid user profile info'}, status=500)
	if not CustomUser.objects.filter(email=user_profile_info['email']).exists():
		signup_via_google(user_profile_info)	
	user_id = CustomUser.objects.get(email=user_profile_info['email']).id
	try:
		user = CustomUser.objects.get(id=user_id)
		refresh = RefreshToken.for_user(user)
		refresh['email'] = user.email
		refresh['is_intra_user'] = True
		refresh['is_superuser'] = False
		access_token = refresh.access_token
	except CustomUser.DoesNotExist:
		return JsonResponse({'error': 'User not found'}, status=404) 
	one_time_code = str(uuid.uuid4())
	if ((user.is_intra_user == True) & (user.is_active == False)):
		one_time_code ='deactivated'
	else:
		cache.set(one_time_code, {'refresh': str(refresh), 'access': str(access_token)}, timeout=EXCAHNGE_CODE_TIMEOUT)
	return redirect(f'{API_42_FRONTEND_CALLBACK_URL}?code={one_time_code}')

 
 
 
 
#3  Retrieves User Info from Google
@csrf_exempt
@permission_classes([AllowAny])
def retrieve_google_user_info(google_access_token):
	response = requests.get(GOOGLE_USER_INFO_URI, headers={'Authorization': f'Bearer {google_access_token}'})
	if response.status_code != 200:
		return JsonResponse({'error': 'Failed to get user info from Google', 'details' : response.json()}, status=response.status_code)
	email = response.json().get('email')
	avatar = response.json().get('picture')
	nickname = response.json().get('name')
	user_profile_info = {
		'email': email,
		'avatar': avatar,
		'nickname': nickname,
	}
	return user_profile_info


import urllib.parse
#4 Create User with  Google credentials
@csrf_exempt
@permission_classes([AllowAny])
def signup_via_google(user_profile_info):
	unused_password_characters = string.ascii_letters + string.digits + string.punctuation
	unused_password = ''.join(random.choice( unused_password_characters) for i in range(20))
	unused_hashed_password = make_password(unused_password)
	user_profile_info['password'] = unused_hashed_password
	serializer = UserSerializer(fields=('email', 'password'), data=user_profile_info)
	try:
		serializer.is_valid(raise_exception=True)
		user = serializer.save()
		user.is_active = True
		user.is_email_verified = True
		user.is_intra_user = True
		user = serializer.save()    
		user_profile = UserProfile.objects.get(user=user)
		user_profile.online_status = "ON"  
		google_avatar_url = user_profile_info['avatar']
		encoded_url = urllib.parse.quote(google_avatar_url)
		user_profile.intra_avatar = f"https://localhost:6010/api/v1/avatar-proxy/?url={encoded_url}"
		iterator = 0
		unique_nickname = user_profile_info['nickname']
		while UserProfile.objects.filter(nickname=unique_nickname).exists():
			iterator += 1
			unique_nickname = unique_nickname+'-'+str(iterator)
		user_profile.nickname = unique_nickname 
		user_profile.save()
  
	except IntegrityError as e:
		return Response(data={'errors': e.detail}, status=status.HTTP_400_BAD_REQUEST)
	return Response(data={'message': 'User\'s has been succesfully created with  Google credentials'}, status=200)

#6. Exchange secret code for tokens
@permission_classes([AllowAny])
class ExchangeCodeView(APIView):
	def post(self, request):
		code = request.data.get('code')
		tokens = cache.get(code)        
		if tokens:
			cache.delete(code)
			return Response(tokens)
		return Response({'error': 'Invalid code'}, status=400)


