"""
Production settings for Reserva.

Usage:
    DJANGO_SETTINGS_MODULE=config.settings.production gunicorn config.wsgi

All sensitive values must be provided via environment variables.
See .env.example for the full list of required variables.
"""

import os
from urllib.parse import urlparse
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent.parent


def _env(key, default=None, required=False):
    """Read an environment variable, optionally raising if missing."""
    value = os.environ.get(key, default)
    if required and not value:
        raise RuntimeError(f"Required environment variable '{key}' is not set.")
    return value


# ---------------------------------------------------------------------------
# Security
# ---------------------------------------------------------------------------
SECRET_KEY = _env('SECRET_KEY', required=True)
DEBUG = False

ALLOWED_HOSTS = [
    host.strip()
    for host in _env('ALLOWED_HOSTS', '').split(',')
    if host.strip()
]

# ---------------------------------------------------------------------------
# Application definition
# ---------------------------------------------------------------------------
INSTALLED_APPS = [
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'django_filters',
    'storages',

    # Local apps
    'apps.core',
    'apps.users',
    'apps.services',
    'apps.telegram_bot',
    'apps.schedules',
    'apps.appointments',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',   # serves static files in production
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
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

WSGI_APPLICATION = 'config.wsgi.application'

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
# Primary: DATABASE_URL env var (PostgreSQL for production)
# Fallback: SQLite (useful for quick demo / university review)
# Manually parse the URL to avoid dj_database_url mishandling Railway-specific
# schemes (e.g. 'railwaypostgresql://') which caused the full URL string to be
# used as the database NAME, exceeding PostgreSQL's 63-character limit.
# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
_db_url = _env('DATABASE_URL')
if _db_url:
    # 1. Clean out any accidental wrapping whitespaces or quotes
    _db_url = _db_url.strip().strip('"').strip("'")
    
    # 2. Force change 'railwaypostgresql' to standard 'postgresql' safely
    if 'railwaypostgresql://' in _db_url:
        _db_url = _db_url.replace('railwaypostgresql://', 'postgresql://', 1)

    _parsed = urlparse(_db_url)
    
    # 3. Defensive check: Did urlparse fail and stick everything in the path?
    _db_name = _parsed.path.lstrip('/')
    if '://' in _db_name or len(_db_name) > 63:
        # Fallback split logic if urlparse still struggles with the custom scheme
        # This splits the string by the last '/' right before the query parameters
        _clean_path = _db_url.split('/')[-1].split('?')[0]
        _db_name = _clean_path

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': _db_name,
            'USER': _parsed.username,
            'PASSWORD': _parsed.password,
            'HOST': _parsed.hostname,
            'PORT': _parsed.port or 5432,
            'CONN_MAX_AGE': 600,
            'OPTIONS': {'connect_timeout': 10},
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }# ---------------------------------------------------------------------------
# Password validation
# ---------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ---------------------------------------------------------------------------
# Internationalisation
# ---------------------------------------------------------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Tashkent'
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static & media files
# ---------------------------------------------------------------------------
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR.parent / 'static']

# ---------------------------------------------------------------------------
# Supabase Storage

# ---------------------------------------------------------------------------
_SUPABASE_PROJECT = 'pnxxcbgqzmiiwzgtmqvc'
_SUPABASE_BUCKET  = 'reserva-media'

AWS_ACCESS_KEY_ID       = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY   = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = _SUPABASE_BUCKET
AWS_S3_ENDPOINT_URL     = f'https://{_SUPABASE_PROJECT}.supabase.co/storage/v1/s3'
AWS_S3_REGION_NAME      = 'eu-central-1'
AWS_S3_CUSTOM_DOMAIN    = f'{_SUPABASE_PROJECT}.supabase.co/storage/v1/object/public/{_SUPABASE_BUCKET}'
AWS_S3_FILE_OVERWRITE   = False
AWS_DEFAULT_ACL         = None
AWS_QUERYSTRING_AUTH    = False

STORAGES = {
    'default': {
        'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/'

# ---------------------------------------------------------------------------
# Custom user model
# ---------------------------------------------------------------------------
AUTH_USER_MODEL = 'users.User'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ---------------------------------------------------------------------------
# REST Framework
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
}

# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in _env('CORS_ALLOWED_ORIGINS', '').split(',')
    if origin.strip()
]
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
]
CSRF_TRUSTED_ORIGINS = [
    'https://reserva-production.up.railway.app',
    'https://reserva-plum.vercel.app',
]

# ---------------------------------------------------------------------------
# Security headers (production hardening)
# ---------------------------------------------------------------------------
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Set to True only when serving over HTTPS
SECURE_SSL_REDIRECT = _env('SECURE_SSL_REDIRECT', 'False').lower() == 'true'
SESSION_COOKIE_SECURE = _env('SECURE_SSL_REDIRECT', 'False').lower() == 'true'
CSRF_COOKIE_SECURE = _env('SECURE_SSL_REDIRECT', 'False').lower() == 'true'
SECURE_HSTS_SECONDS = 31536000 if SECURE_SSL_REDIRECT else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = SECURE_SSL_REDIRECT
SECURE_HSTS_PRELOAD = SECURE_SSL_REDIRECT
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')


# ---------------------------------------------------------------------------
# Email
# ---------------------------------------------------------------------------
EMAIL_BACKEND = _env(
    'EMAIL_BACKEND',
    'django.core.mail.backends.smtp.EmailBackend',
)
EMAIL_HOST = _env('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(_env('EMAIL_PORT', '587'))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = _env('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = _env('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = _env('DEFAULT_FROM_EMAIL', 'noreply@reserva.uz')

# ---------------------------------------------------------------------------
# Telegram Bot
# ---------------------------------------------------------------------------
TELEGRAM_BOT_TOKEN = _env('TELEGRAM_BOT_TOKEN', required=True)
TELEGRAM_BOT_USERNAME = _env('TELEGRAM_BOT_USERNAME', '')

# ---------------------------------------------------------------------------
# Frontend URL (used in Telegram deep-links)
# ---------------------------------------------------------------------------
FRONTEND_URL = _env('FRONTEND_URL', required=True)

# ---------------------------------------------------------------------------
# Google reCAPTCHA v2
# ---------------------------------------------------------------------------
RECAPTCHA_SECRET_KEY = _env('RECAPTCHA_SECRET_KEY', required=True)
