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
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # API framework
    'rest_framework',
    # UserManagement
    'people.apps.PeopleConfig',
    'users',
    'user_profile',
    'user_login',
    'rest_framework.authtoken', #authtoken for authentication

    'rest_framework_simplejwt.token_blacklist',
]



MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
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

    "DEFAULT_AUTHENTICATION_CLASSES": [
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
CORS_ORIGIN_ALLOW_ALL = False
CSRF_TRUSTED_ORIGINS = ['http://localhost:4200/']
CORS_ALLOWED_ORIGINS = ['http://localhost:4200']
CORS_ALLOW_CREDENTIALS = True
#CSRF_COOKIE_HTTPONLY = False #should I set it or not?

# ------------------------ JWT settings -------------------------:
SIMPLE_JWT = {
    'REFRESH_TOKEN_LIFETIME': timedelta(days=15),
    'ROTATE_REFRESH_TOKENS': False,
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=2),
    'BLACKLIST_AFTER_ROTATION': True,
    
}

# ------------------------- Common default settings -----------------------------:
USER_DEFAULT_HOMEPAGE = 'http://localhost:8000/api/v1/user/'


# ----------------- OAUTH2.0  42 INTRA SETTINGS -----------------:
API_42_AUTH_URL					= 'https://api.intra.42.fr/oauth/authorize'  # 42 Intra auth URL
API_42_ACCESS_TOKEN_ENDPOINT	= 'https://api.intra.42.fr/oauth/token'		 # 42 Intra access token endpoint
API_42_REDIRECT_URI				= 'http://localhost:8000/api/v1/call_back/'	 # 42 Intra redirect URI
API_42_INTRA_ENTRYPOINT_URL		= 'https://api.intra.42.fr/v2/'				 # 42 Intra entrypoint URL

# --------------------Channels things---------------------------:
ASGI_APPLICATION = 'user_management.routing.application'

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0:8000']

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
    'x-csrftoken',
    'x-requested-with',
]

# LOGGING = {
#     'version': 1,
#     'disable_existing_loggers': False,
#     'handlers': {
#         'console': {
#             'class': 'logging.StreamHandler',
#         },
#     },
#     'loggers': {
#         'django': {
#             'handlers': ['console'],
#             'level': 'DEBUG',
#         },
#         'channels': {
#             'handlers': ['console'],
#             'level': 'DEBUG',
#         },
#     },
# }

# CHANNEL_LAYERS = {
#     'default': {
#         'BACKEND': 'channels.layers.InMemoryChannelLayer',
#     },
# }



# Media files (Uploaded files)
STATIC_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
#USER_UPLOADS_ROOT = os.path.join(BASE_DIR, 'media')
