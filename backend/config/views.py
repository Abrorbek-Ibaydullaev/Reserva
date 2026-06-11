import json
import os

from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

SUPPORTED_LANGS = ['uz', 'en', 'ru']


@api_view(['GET'])
@permission_classes([AllowAny])
def get_translations(request, lang):
    """Serve the shared translation JSON for a language.

    Not used by the web frontend (it loads /locales/ static files directly).
    Exists so the future mobile app can fetch live translations over the air
    without an App Store update.
    """
    if lang not in SUPPORTED_LANGS:
        lang = 'uz'
    locale_path = os.path.join(
        settings.BASE_DIR, '..', 'shared', 'locales', lang, 'translation.json'
    )
    try:
        with open(locale_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        return Response(
            {'detail': 'Translation file not found.'}, status=404
        )
    return Response(data)
