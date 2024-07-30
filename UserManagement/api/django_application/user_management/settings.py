"""
Django settings for user_management project.

Generated by 'django-admin startproject' using Django 5.0.6.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.0/ref/settings/
"""
# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

import os
from pathlib import Path
import argon2
from datetime import timedelta
from .utils import get_env_or_file_value
import logging
import colorlog
from pythonjsonlogger import jsonlogger

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
#TODO: make sure secret is onlz from env file in production
SECRET_KEY = get_env_or_file_value("SECRET_KEY", "asjhdghasj")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = get_env_or_file_value("DEBUG", False)
ALLOWED_HOSTS = get_env_or_file_value("DJANGO_ALLOWED_HOSTS", "").split(" ")

# Default url config
ROOT_URLCONF = 'user_management.urls'

WSGI_APPLICATION = 'user_management.wsgi.application'

# Application definition
INSTALLED_APPS = [
    'channels',
    'daphne',
    'corsheaders',
    # 'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # API framework
    'rest_framework',
    # UserManagement
    'users',
    'user_profile',
    'user_login',
    'rest_framework.authtoken', #authtoken for authentication

    'rest_framework_simplejwt.token_blacklist',
    'chat',
    'match',
    'tournament',

    #TODO: remove
    # 'django_extensions',
]



MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    # 'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, 'templates'),
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                
            ],
        },
    },
]

# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": get_env_or_file_value("SQL_ENGINE"),
        "NAME": get_env_or_file_value("SQL_DATABASE_NAME"),
        "USER": get_env_or_file_value("SQL_DATABASE_USER"),
        "PASSWORD": get_env_or_file_value("SQL_DATABASE_PASSWORD"),
        "HOST": get_env_or_file_value("SQL_DATABASE_HOST"),
        "PORT": get_env_or_file_value("SQL_DATABASE_PORT"),
    }
}

# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Europe/Berlin'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

#STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],

    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],

    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend"
    ],

    #TODO: change visibility for OPTIONS request
    "DEFAULT_AUTHENTICATION_CLASSES": [
        # TODO: remove later or something since only neccesary to use browsable api easily
        "rest_framework.authentication.SessionAuthentication",

        "rest_framework.authentication.TokenAuthentication",
        "rest_framework_simplejwt.authentication.JWTAuthentication"
    ],
}

AUTH_USER_MODEL = "users.CustomUser"


# ----------------- Sign up SMTP settings for e-mail service --------------------:
EMAIL_BACKEND       = get_env_or_file_value("EMAIL_BACKEND")
EMAIL_HOST          = get_env_or_file_value("EMAIL_HOST")
EMAIL_HOST_USER     = get_env_or_file_value("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = get_env_or_file_value("EMAIL_HOST_PASSWORD")
EMAIL_PORT          = get_env_or_file_value("EMAIL_PORT")
EMAIL_USE_TLS       = get_env_or_file_value("EMAIL_USE_TLS")
DEFAULT_FROM_EMAIL  = EMAIL_HOST_USER

# Email content
EMAIL_SUBJECT_FORGOT_PASSWORD	= 'Pong password recovery'
EMAIL_SUBJECT_VERIFICATION		= 'Pong email verification'
EMAIL_BODY_VERIFICATION			= '\n\nPlease click on the following link to verify your email:'
EMAIL_BODY_FORGOT_PASSWORD 	 	= '\n\nPlease click on the following link to reset your password:'

# ------------------------ Argon2id hash algo settings" -------------------------:
PASSWORD_HASHERS = ['django.contrib.auth.hashers.Argon2PasswordHasher']
argon2.DEFAULT_RANDOM_SALT_LENGTH = 16         # Length of random salt in bytes
argon2.DEFAULT_HASH_LENGTH        = 32         # Hash length in bytes
argon2.DEFAULT_MEMORY_COST        = 512        # Memory usage in kilobytes
argon2.DEFAULT_PARALLELISM        = 2          # Degree of parallelism
argon2.DEFAULT_TIME_COST          = 2          # Iterations count

# ------------------------ login settings -------------------------:
# CSRF_COOKIE_HTTPONLY = False #should I set it or not?
CORS_ALLOW_ALL_ORIGINS = False
CSRF_TRUSTED_ORIGINS = [ "https://localhost:4010", "https://localhost:6010" ]
CORS_ALLOWED_ORIGINS = [ "https://localhost:4010", "https://localhost:6010" ]
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'Content-Type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

#CORS_ALLOW_ALL_ORIGINS = True  # Только для разработки!
#CORS_ALLOW_CREDENTIALS = True
# CSRF_COOKIE_SECURE = not DEBUG

# CSRF_COOKIE_NAME = 'csrftoken'

# ------------------------ JWT settings -------------------------:
SIMPLE_JWT = {
    'REFRESH_TOKEN_LIFETIME': timedelta(days=15),
    'ROTATE_REFRESH_TOKENS': False,
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=100),
    'BLACKLIST_AFTER_ROTATION': True,

}

# ------------------------- Common default settings -----------------------------:
USER_DEFAULT_HOMEPAGE = 'https://localhost:6010/api/v1/user/'


# ----------------- OAUTH 2.0 - 42 INTRA SETTINGS -----------------:
API_42_AUTH_URL					= 'https://api.intra.42.fr/oauth/authorize'  # 42 Intra auth URL
API_42_ACCESS_TOKEN_ENDPOINT	= 'https://api.intra.42.fr/oauth/token'		 # 42 Intra access token endpoint
API_42_REDIRECT_URI				= 'https://localhost:6010/api/v1/call_back/' # 42 Intra redirect URI
API_42_INTRA_ENTRYPOINT_URL		= 'https://api.intra.42.fr/v2/'				 # 42 Intra entrypoint URL
API_42_FRONTEND_CALLBACK_URL	= 'https://localhost:4010/auth-success'		 # 42 Intra frontend callback URL
EXCAHNGE_CODE_TIMEOUT           =  30								         # one-time code lifetime in seconds


# ----------------- OAUTH 2.0 - GOOGLE SETTINGS -----------------:
GOOGLE_SCOPES        = [
	                    'https://www.googleapis.com/auth/userinfo.email',     # access to email
	                    'https://www.googleapis.com/auth/userinfo.profile']   # access to profile information
GOOGLE_AUTH_URI      =  'https://accounts.google.com/o/oauth2/auth'           # request for authentication
GOOGLE_TOKEN_URI     =  'https://accounts.google.com/o/oauth2/token'          # request for token
GOOGLE_USER_INFO_URI =  'https://www.googleapis.com/oauth2/v1/userinfo'       # request for user information
GOOGLE_REDIRECT_URI  =  'https://localhost:6010/api/v1/google_call_back/'     # redirect URI



# ----------------- 2FA SETTINGS -----------------:
OTP_EXPIRY_MINUTES = 2
# OTP_FROM_EMAIL = DEFAULT_FROM_EMAIL
OTP_FROM_EMAIL = "from@example.com"


# ----------------- ACCOUNT ACTIVATION SETTINGS -----------------:
ACCOUNT_ACTIVATION_TIMEOUT_SECONDS = 60 * 60 * 24 # 24 hours
FRONTEND_URL                       = "https://localhost:4010"

# ----------------- PASSWORD RECOVERY SETTINGS -----------------:
PASSWORD_RESET_TIMEOUT = 60 * 60 # 1 hour

# ----------------- CHANGE EMAIL SETTINGS -----------------:
EMAIL_CHANGE_TIMEOUT_SECONDS = 60 * 30 # 30 minutes
# --------------------Channels things---------------------------:
ASGI_APPLICATION = 'user_management.routing.application'

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0:8000',
                 'localhost:6010', 'api', 'localhost:4010',
                 'https://localhost:6010', 'https://localhost:4010']

CHANNEL_LAYERS = {
    # 'default': {
    #     'BACKEND': 'channels_redis.core.RedisChannelLayer',
    #     'CONFIG': {
    #         "hosts": [('127.0.0.1',6379)]
    #     },
    # },
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer'
    }
}


CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    # 'x-csrftoken',
    'x-requested-with',
]


# ----------------------- LOGGER SETTINGS -------------------------:
#How to use logger:
    # add to code  logger.info('This is an info message')
    # add to code  logger.error('This is an error message')

LOG_LEVEL = 'WARNING'                # Change to level you need: (DEBUG, INFO, WARNING, ERROR, CRITICAL)
LOG_HANDLER = ['console']    # Change to handler you need: ['console', 'file'] 

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'colored': {
            '()': 'colorlog.ColoredFormatter',
            'format': '%(log_color)s%(asctime)s %(levelname)s %(name)s %(message)s',
            'log_colors': {
                'DEBUG': 'cyan',
                'INFO': 'green',
                'WARNING': 'yellow',
                'ERROR': 'red',
                'CRITICAL': 'red,bg_white',
            },
        },         
        'json': {
            '()': jsonlogger.JsonFormatter,
            'format': '%(asctime)s %(levelname)s %(message)s',
        },
    },
    
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'colored',
        },
        # 'file': {
        #     'class': 'logging.FileHandler',
        #     'filename': '/app/logs/app.log',
        #     'formatter': 'json',
        # },
    },
    
    'loggers': {
        '': {
            'handlers': LOG_HANDLER,        
            'level': LOG_LEVEL,
            'propagate': True,
        },
        'django': {
            'handlers': LOG_HANDLER,
            'level': LOG_LEVEL,
            'propagate': False,
      },
        'django.request': {
            'handlers': LOG_HANDLER,
            'level': LOG_LEVEL,
            'propagate': False,
        },
        'rest_framework': {
            'handlers': LOG_HANDLER,
            'level': LOG_LEVEL,
            'propagate': False,
        },
    },
}

# CHANNEL_LAYERS = {
#     'default': {
#         'BACKEND': 'channels.layers.InMemoryChannelLayer',
#     },
# }



# Media files (Uploaded files)
STATIC_URL = '/static/'
MEDIA_URL = 'https://localhost:6010/avatars/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'avatars')

# SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
# USE_X_FORWARDED_HOST = True
# SECURE_SSL_REDIRECT = True
# SESSION_COOKIE_SECURE = True
# CSRF_COOKIE_SECURE = True