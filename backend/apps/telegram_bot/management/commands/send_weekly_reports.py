from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.db.models import Count, Sum, Q
from django.contrib.auth import get_user_model

User = get_user_model()


def _week_range():
    today = date.today()
    start = today - timedelta(days=today.weekday() + 1 if today.weekday() != 6 else 0)
    # Sunday of the current week = start of next Mon minus 1 day
    # Simpler: week is Mon–Sun; "this week" = last 7 days up to today
    week_start = today - timedelta(days=6)
    return week_start, today


def _fmt_money(amount):
    return f"${float(amount or 0):,.2f}"


def _send_business_report(owner):
    from apps.appointments.models import Appointment
    from apps.telegram_bot.service import send_message

    chat_id = None
    try:
        chat_id = owner.profile.telegram_chat_id
    except Exception:
        pass
    if not chat_id:
        return

    week_start, week_end = _week_range()
    qs = Appointment.objects.filter(
        business_owner=owner,
        date__range=(week_start, week_end),
    )

    total = qs.count()
    completed = qs.filter(status='completed').count()
    cancelled = qs.filter(status='cancelled').count()
    active = qs.filter(status__in=['pending', 'confirmed', 'rescheduled']).count()
    revenue = qs.filter(status='completed').aggregate(
        total=Sum('total_amount'))['total'] or 0

    # Top service
    top_service = (
        qs.filter(status='completed')
        .values('service__name')
        .annotate(cnt=Count('id'))
        .order_by('-cnt')
        .first()
    )
    top_service_line = (
        f"\n🏆 Top service: <b>{top_service['service__name']}</b> ({top_service['cnt']} bookings)"
        if top_service else ''
    )

    # Top employee
    top_emp = (
        qs.filter(status='completed', employee__isnull=False)
        .values('employee__user__first_name', 'employee__user__last_name')
        .annotate(cnt=Count('id'))
        .order_by('-cnt')
        .first()
    )
    top_emp_line = ''
    if top_emp:
        name = f"{top_emp['employee__user__first_name']} {top_emp['employee__user__last_name']}".strip()
        top_emp_line = f"\n👤 Top staff: <b>{name}</b> ({top_emp['cnt']} appts)"

    business_name = ''
    try:
        business_name = owner.profile.business_name or owner.get_full_name()
    except Exception:
        business_name = owner.get_full_name()

    send_message(
        chat_id,
        f"📊 <b>Weekly Report</b>\n"
        f"<i>{week_start.strftime('%b %d')} – {week_end.strftime('%b %d, %Y')}</i>\n\n"
        f"💼 <b>{business_name}</b>\n\n"
        f"📅 Total appointments: <b>{total}</b>\n"
        f"  ✅ Completed: {completed}\n"
        f"  ❌ Cancelled: {cancelled}\n"
        f"  ⏳ Active: {active}\n\n"
        f"💰 Revenue this week: <b>{_fmt_money(revenue)}</b>"
        f"{top_service_line}"
        f"{top_emp_line}\n\n"
        f"Have a great week ahead! 🚀",
    )


def _send_employee_report(employee):
    from apps.appointments.models import Appointment
    from apps.telegram_bot.service import send_message

    chat_id = None
    try:
        chat_id = employee.user.profile.telegram_chat_id
    except Exception:
        pass
    if not chat_id:
        return

    week_start, week_end = _week_range()
    qs = Appointment.objects.filter(
        employee=employee,
        date__range=(week_start, week_end),
    )

    total = qs.count()
    completed = qs.filter(status='completed').count()
    cancelled = qs.filter(status='cancelled').count()
    active = qs.filter(status__in=['pending', 'confirmed', 'rescheduled']).count()
    total_minutes = qs.filter(status='completed').aggregate(
        mins=Sum('duration'))['mins'] or 0
    hours, mins = divmod(total_minutes, 60)
    time_str = f"{hours}h {mins}m" if hours else f"{mins}m"

    first_name = employee.user.first_name or 'there'

    send_message(
        chat_id,
        f"📊 <b>Your Weekly Summary</b>\n"
        f"<i>{week_start.strftime('%b %d')} – {week_end.strftime('%b %d, %Y')}</i>\n\n"
        f"Hey <b>{first_name}</b>! Here's how your week went:\n\n"
        f"📅 Appointments: <b>{total}</b>\n"
        f"  ✅ Completed: {completed}\n"
        f"  ❌ Cancelled: {cancelled}\n"
        f"  ⏳ Active: {active}\n\n"
        f"⏱ Time in service: <b>{time_str}</b>\n\n"
        f"{'💪 Great week — keep it up!' if completed >= 5 else '📈 Every appointment counts. See you next week!'} 🙌",
    )


def send_all_reports(stdout=None):
    from apps.schedules.models import Employee

    owners = User.objects.filter(
        user_type='business_owner',
        profile__telegram_chat_id__isnull=False,
    ).exclude(profile__telegram_chat_id='').select_related('profile')

    owner_count = 0
    for owner in owners:
        try:
            _send_business_report(owner)
            owner_count += 1
        except Exception as exc:
            if stdout:
                stdout.write(f'Error sending report for {owner.email}: {exc}')

    employees = Employee.objects.filter(
        user__profile__telegram_chat_id__isnull=False,
    ).exclude(user__profile__telegram_chat_id='').select_related('user', 'user__profile')

    emp_count = 0
    for employee in employees:
        try:
            _send_employee_report(employee)
            emp_count += 1
        except Exception as exc:
            if stdout:
                stdout.write(f'Error sending report for {employee.user.email}: {exc}')

    return owner_count, emp_count


class Command(BaseCommand):
    help = 'Send weekly Telegram reports to business owners and employees'

    def handle(self, *args, **options):
        owner_count, emp_count = send_all_reports(stdout=self.stdout)
        self.stdout.write(
            self.style.SUCCESS(
                f'Weekly reports sent — {owner_count} business owners, {emp_count} employees.'
            )
        )
