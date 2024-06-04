import os
import string
import secrets
import random
import requests

from django.http import JsonResponse
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import IntegrityError
from django.contrib.auth.hashers import make_password
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status

from base64 import urlsafe_b64encode, urlsafe_b64decode
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from users.models import CustomUser
from users.serializers import UserRegisterSerializer
from user_profile.models import UserProfile
from user_management.settings import	API_42_AUTH_URL, API_42_REDIRECT_URI, \
										API_42_ACCESS_TOKEN_ENDPOINT, \
				 						API_42_INTRA_ENTRYPOINT_URL

from user_management.utils import get_env_or_file_value


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
        # #print('AES_KEY not found in .env file. Generating new key...')
        # aes_key = AESGCM.generate_key(bit_length=256)
        # with open('.env', 'a') as f:
        #     f.write(f'AES_KEY={aes_key.hex()}\n')
    else:
        aes_key = bytes.fromhex(aes_key)
    return aes_key

# Encrypt and decrypt query parameters
def encrypt_query_param(param_value):
    #print('**PARAM VALUE', param_value)
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
        print ('**DECRYPTED STATE', decrypted_string)
        return True 
    except Exception:
        return False  




# 1. 42 Intra Login request
@csrf_exempt
@require_http_methods(["GET"])
@permission_classes([AllowAny])
def FortyTwoIntraLogin(request):	   
    	
	characters = string.ascii_letters + string.digits    
	uncrypted_state = ''.join(secrets.choice(characters) for _ in range(10))
	byte_string = uncrypted_state.encode()
	encrypted_state = encrypt_query_param(byte_string)

	#print('----1.encrypted_state', encrypted_state)
	auth_request = '{base_url}?client_id={client_id}&redirect_uri={redirect_uri}&response_type={response_type}&scope={scope}&state={state}'

	print("fancy mark here??????", get_env_or_file_value("INTRA_UID_42"))
	auth_request = auth_request.format(
		base_url=API_42_AUTH_URL,
		client_id=get_env_or_file_value("INTRA_UID_42"),
		redirect_uri=API_42_REDIRECT_URI,
		response_type='code',
		scope='public',
		state=encrypted_state
	)
	#print('----1auth request: ', auth_request)
	return redirect(auth_request)


 
# 2 42 Intra Login callback handling
@csrf_exempt
@require_http_methods(["GET"])
@permission_classes([AllowAny])
def FortyTwoIntraLoginCallback(request):

	#print('**RECEIVED REQUEST', request.GET)
	code = request.GET.get('code') 
	encrypted_state = request.GET.get('state')

	if not decrypt_query_param(encrypted_state) :
		#print('**not decrypted\n')
		return JsonResponse({'error': 'State from Intra callback cannot be decrypted'}, status=400) 
	#print('**decrypted\n')
	if not code:
		return JsonResponse({'error': 'code hasn\'t been received from intra'}, status=400)  
	token_request = {
		"grant_type": "authorization_code",
  		"client_id": get_env_or_file_value("INTRA_UID_42"),
    	"client_secret": get_env_or_file_value("CLIENT_42_SECRET"),
		"code": code,
		"redirect_uri": API_42_REDIRECT_URI,
		"state": encrypted_state,
	}

	response = requests.post(API_42_ACCESS_TOKEN_ENDPOINT, data=token_request)
	#print('**RESPONSE', response.json())
	encrypted_state_2 = request.GET.get('state')	
	if not decrypt_query_param(encrypted_state_2) :
		return JsonResponse({'error': 'State from Intra callback cannot be decrypted'}, status=400)
 
	if not(200 <= response.status_code < 300):
		return JsonResponse({'error': 'Failed to get access token'}, status=401)
	intra_access_token = response.json().get('access_token')
	user_profile_info = retrieve_user_info(intra_access_token)
	if not isinstance(user_profile_info, dict) or not validate_user_profile_info(user_profile_info):
		return JsonResponse({'error': 'Invalid user profile info'}, status=500)

	if not CustomUser.objects.filter(email=user_profile_info['email']).exists():
		signup_via_intra(user_profile_info)
	
	user_id = CustomUser.objects.get(email=user_profile_info['email']).id
	
	try:
		user = CustomUser.objects.get(id=user_id)
		jwt_token = generate_tokens(user)
  
	except CustomUser.DoesNotExist:
		return JsonResponse({'error': 'User not found'}, status=404) 
	
	return JsonResponse(jwt_token, status=200)



#5 STANDART JWT TOKEN GENERATION:
# def generate_tokens(user):
#     refresh = RefreshToken.for_user(user)

#     return {
#         'refresh': str(refresh),
#         'access': str(refresh.access_token),
#     }

#5 CUSTOM JWT TOKEN GENERATION:
def generate_tokens(user):
	refresh = RefreshToken.for_user(user)
	refresh['email'] = user.email
	refresh['is_admin'] = user.is_admin

	access_token = refresh.access_token
	# access_token['email'] = user.email
	# access_token['is_admin'] = user.is_admin
	return {
		'refresh': str(refresh),
		'access': str(access_token),
	}

 
#3 42 Retrieves User Info from 42 Intra
@csrf_exempt
@permission_classes([AllowAny])
def retrieve_user_info(intra_access_token):
	response = requests.get(API_42_INTRA_ENTRYPOINT_URL + '/me', headers={'Authorization': f'Bearer {intra_access_token}'})
	if response.status_code != 200:
		return JsonResponse({'error': 'Failed to get user info from 42Intra', 'details' : response.json()}, status=response.status_code)
	email = response.json().get('email')
	avatar = response.json().get('image', {}).get('versions', {}).get('small')
	nickname = response.json().get('login')
	user_profile_info = {
		'email': email,
		'avatar': avatar,
		'nickname': nickname,
	}
	#print('USER PROFILE INFO: ', user_profile_info)
	return user_profile_info

#4 Create User with 42 Intra credentials
@csrf_exempt
@permission_classes([AllowAny])
def signup_via_intra(user_profile_info):
	unused_password_characters = string.ascii_letters + string.digits + string.punctuation
	unused_password = ''.join(random.choice( unused_password_characters) for i in range(20))
	#print('unused_password', unused_password)
	unused_hashed_password = make_password(unused_password)
	user_profile_info['password'] = unused_hashed_password
	serializer = UserRegisterSerializer(data=user_profile_info)
	try:
		serializer.is_valid(raise_exception=True)
		user = serializer.save()
		user.is_active = True
		user.is_email_verified = True
		user = serializer.save()  
  
		user_profile = UserProfile.objects.get(user=user)
		user_profile.online_status = "ON"
		user_profile.avatar = user_profile_info['avatar']
		user_profile.nickname = user_profile_info['nickname']
		user_profile.save()

	except IntegrityError as e:
		return Response(data={'errors': e.detail}, status=status.HTTP_400_BAD_REQUEST)
	return Response(data={'message': 'User\'s has been succesfully created with 42 Intra credentials'}, status=200)