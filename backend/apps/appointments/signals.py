from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Appointment


def _get_chat_id(user):
    try:
        return user.profile.telegram_chat_id
    except Exception:
        return None


def _fmt_time(t):
    if not t:
        return ''
    try:
        h, m = str(t).split(':')[:2]
        hour = int(h)
        suffix = 'PM' if hour >= 12 else 'AM'
        hour = hour % 12 or 12
        return f"{hour}:{m} {suffix}"
    except Exception:
        return str(t)


@receiver(pre_save, sender=Appointment)
def capture_old_status(sender, instance, **kwargs):
    """Store previous status before save so we can detect changes."""
    if instance.pk:
        try:
            instance._old_status = Appointment.objects.get(pk=instance.pk).status
        except Appointment.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=Appointment)
def send_appointment_notification(sender, instance, created, **kwargs):
    from apps.telegram_bot.service import send_message

    customer_chat = _get_chat_id(instance.customer)
    owner_chat = _get_chat_id(instance.business_owner)
    service_name = instance.service.name if instance.service_id else 'Service'
    date_str = str(instance.date)
    time_str = _fmt_time(instance.start_time)
    business_name = ''
    try:
        p = instance.business_owner.profile
        business_name = p.business_name or instance.business_owner.get_full_name()
    except Exception:
        business_name = instance.business_owner.get_full_name()

    customer_name = instance.customer.get_full_name() or instance.customer.email

    if created:
        if customer_chat:
            send_message(
                customer_chat,
                f"📅 <b>Booking received!</b>\n\n"
                f"<b>{service_name}</b>\n"
                f"📍 {business_name}\n"
                f"🗓 {date_str} at {time_str}\n\n"
                f"Your appointment is pending confirmation. We'll notify you when it's confirmed.",
            )
        if owner_chat:
            send_message(
                owner_chat,
                f"🔔 <b>New booking!</b>\n\n"
                f"<b>{customer_name}</b> booked <b>{service_name}</b>\n"
                f"🗓 {date_str} at {time_str}\n\n"
                f"Open your dashboard to confirm or manage this appointment.",
            )
        return

    old_status = getattr(instance, '_old_status', None)
    new_status = instance.status

    if old_status == new_status:
        return

    if new_status == 'confirmed':
        if customer_chat:
            send_message(
                customer_chat,
                f"✅ <b>Appointment confirmed!</b>\n\n"
                f"<b>{service_name}</b>\n"
                f"📍 {business_name}\n"
                f"🗓 {date_str} at {time_str}\n\n"
                f"See you there!",
            )

    elif new_status == 'cancelled':
        if customer_chat:
            send_message(
                customer_chat,
                f"❌ <b>Appointment cancelled</b>\n\n"
                f"<b>{service_name}</b> on {date_str} at {time_str} has been cancelled.\n\n"
                f"Book a new appointment at reserva.uz",
            )
        if owner_chat:
            send_message(
                owner_chat,
                f"❌ <b>Appointment cancelled</b>\n\n"
                f"<b>{customer_name}</b> cancelled their <b>{service_name}</b> on {date_str} at {time_str}.",
            )

    elif new_status == 'completed':
        if customer_chat:
            from django.conf import settings
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            rebook_url = f'{frontend_url}/book/{instance.service_id}'
            review_url = f'{frontend_url}/business/{instance.business_owner_id}'
            send_message(
                customer_chat,
                f"⭐ <b>How was your visit?</b>\n\n"
                f"You just completed <b>{service_name}</b> at {business_name}.\n\n"
                f"💬 <b>Leave a review</b> — it only takes a second and helps others find great services.\n\n"
                f"Want to come back? Hit <b>Rebook</b> below 👇",
                buttons=[
                    ('✍️ Leave a Review', review_url),
                    ('📅 Rebook', rebook_url),
                ],
            )
