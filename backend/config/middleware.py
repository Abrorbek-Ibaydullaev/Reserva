from django.utils import translation

SUPPORTED_LANGS = ['uz', 'en', 'ru']


class LanguageMiddleware:
    """Activate the request language from ?lang=, cookie, or Accept-Language.

    Lets API clients (web frontend, future mobile app) control the language
    of validation errors and other translated responses.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        lang = (
            request.GET.get('lang') or
            request.COOKIES.get('django_language') or
            request.META.get('HTTP_ACCEPT_LANGUAGE', 'uz')[:2]
        )
        if lang not in SUPPORTED_LANGS:
            lang = 'uz'
        translation.activate(lang)
        request.LANGUAGE_CODE = lang
        response = self.get_response(request)
        translation.deactivate()
        return response
