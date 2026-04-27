import time
import logging
from django.core.management.base import BaseCommand
from django.conf import settings
import requests

logger = logging.getLogger(__name__)

BOT_TOKEN = getattr(settings, 'TELEGRAM_BOT_TOKEN', '')


def get_updates(offset=None):
    params = {'timeout': 30, 'allowed_updates': ['message']}
    if offset:
        params['offset'] = offset
    try:
        r = requests.get(
            f'https://api.telegram.org/bot{BOT_TOKEN}/getUpdates',
            params=params,
            timeout=35,
        )
        return r.json().get('result', [])
    except Exception as exc:
        logger.error('getUpdates error: %s', exc)
        return []


def handle_update(update):
    from apps.telegram_bot.service import verify_link_token, send_message
    from apps.users.models import UserProfile

    message = update.get('message', {})
    text = message.get('text', '').strip()
    chat = message.get('chat', {})
    chat_id = str(chat.get('id', ''))
    first_name = chat.get('first_name', 'there')

    if text.startswith('/start'):
        parts = text.split(' ', 1)
        if len(parts) == 2:
            token = parts[1].strip()
            user_id = verify_link_token(token)
            if user_id:
                try:
                    profile = UserProfile.objects.get(user_id=user_id)
                    profile.telegram_chat_id = chat_id
                    profile.save(update_fields=['telegram_chat_id'])
                    send_message(
                        chat_id,
                        f"✅ <b>Connected!</b>\n\n"
                        f"Hey {first_name}, your Telegram is now linked to Reserva. "
                        f"You'll get instant notifications for bookings, confirmations, and reminders here.",
                    )
                    return
                except UserProfile.DoesNotExist:
                    pass
            send_message(chat_id, '❌ Invalid or expired link. Please generate a new one from your profile.')
        else:
            send_message(
                chat_id,
                f"👋 <b>Welcome to Reserva Bot!</b>\n\n"
                f"To receive booking notifications, open your profile settings on Reserva and tap <b>Connect Telegram</b>.",
            )


class Command(BaseCommand):
    help = 'Runs the Telegram bot using long polling'

    def handle(self, *args, **options):
        if not BOT_TOKEN:
            self.stderr.write('TELEGRAM_BOT_TOKEN is not set in settings.')
            return

        self.stdout.write('Telegram bot is running. Press Ctrl+C to stop.')
        offset = None

        while True:
            updates = get_updates(offset)
            for update in updates:
                try:
                    handle_update(update)
                except Exception as exc:
                    logger.error('Error handling update: %s', exc)
                offset = update['update_id'] + 1
            if not updates:
                time.sleep(1)
