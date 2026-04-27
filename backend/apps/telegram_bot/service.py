import hmac
import hashlib
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

BOT_TOKEN = getattr(settings, 'TELEGRAM_BOT_TOKEN', '')
BOT_USERNAME = getattr(settings, 'TELEGRAM_BOT_USERNAME', '')


def _api(method, **kwargs):
    """Call a Telegram Bot API method. Re-reads token dynamically each call."""
    token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '')
    if not token:
        return None
    try:
        r = requests.post(
            f'https://api.telegram.org/bot{token}/{method}',
            json=kwargs,
            timeout=10,
        )
        return r.json()
    except Exception as exc:
        logger.error('Telegram API error (%s): %s', method, exc)
        return None


def send_message(chat_id, text, buttons=None):
    """Send an HTML message to a Telegram chat.

    buttons: list of (label, url) tuples rendered as a single row of inline URL buttons.
    """
    if not chat_id:
        return
    kwargs = {'chat_id': str(chat_id), 'text': text, 'parse_mode': 'HTML'}
    if buttons:
        kwargs['reply_markup'] = {
            'inline_keyboard': [
                [{'text': label, 'url': url} for label, url in buttons]
            ]
        }
    _api('sendMessage', **kwargs)


def make_link_token(user_id):
    """Return a short HMAC token used to link a Telegram account."""
    secret = settings.SECRET_KEY.encode()
    sig = hmac.new(secret, str(user_id).encode(), hashlib.sha256).hexdigest()
    return f"{user_id}-{sig[:16]}"


def verify_link_token(token):
    """Return the user_id from a valid token, or None."""
    try:
        user_id_str, sig = token.rsplit('-', 1)
        user_id = int(user_id_str)
        expected = make_link_token(user_id)
        expected_sig = expected.rsplit('-', 1)[1]
        if hmac.compare_digest(sig, expected_sig):
            return user_id
    except Exception:
        pass
    return None


def get_telegram_link(user_id):
    """Return the deep-link URL for connecting a user's Telegram account."""
    bot_username = getattr(settings, 'TELEGRAM_BOT_USERNAME', '')
    if not bot_username:
        return None
    token = make_link_token(user_id)
    return f'https://t.me/{bot_username}?start={token}'
