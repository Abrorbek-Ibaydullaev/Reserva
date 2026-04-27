from datetime import date, time
from unittest.mock import MagicMock, patch

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.appointments.models import Appointment
from apps.services.models import Category, Service
from apps.users.models import User, UserProfile


def make_customer(email='customer@example.com'):
    return User.objects.create_user(
        email=email,
        password='testpass123',
        user_type='customer',
        first_name='Customer',
    )


def make_owner(email='owner@example.com'):
    return User.objects.create_user(
        email=email,
        password='testpass123',
        user_type='business_owner',
        first_name='Owner',
    )


def make_service(owner, category, name='Haircut'):
    return Service.objects.create(
        business_owner=owner,
        category=category,
        name=name,
        description='Test service',
        price='25.00',
        duration=60,
        is_active=True,
    )


def make_appointment(customer, owner, service, appt_time=None, appt_status='pending'):
    return Appointment.objects.create(
        customer=customer,
        business_owner=owner,
        service=service,
        date=date.today(),
        start_time=appt_time or time(10, 0),
        duration=60,
        service_price='25.00',
        status=appt_status,
    )


class AppointmentCreationPermissionsTests(APITestCase):
    def setUp(self):
        self.owner = make_owner()
        self.customer = make_customer()
        self.category = Category.objects.create(name='Hair')
        self.service = make_service(self.owner, self.category)
        self.url = reverse('appointment-list')

    def test_business_owner_cannot_create_appointment(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            self.url,
            {
                'service': self.service.id,
                'date': date.today().isoformat(),
                'start_time': '10:00:00',
                'duration': 60,
                'customer_notes': 'Attempted owner booking',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Booking not allowed')
        self.assertEqual(
            response.data['details'],
            'Only customers can create appointments.',
        )

    def test_unauthenticated_cannot_create_appointment(self):
        response = self.client.post(
            self.url,
            {
                'service': self.service.id,
                'date': date.today().isoformat(),
                'start_time': '10:00:00',
                'duration': 60,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AppointmentStatusTests(APITestCase):
    def setUp(self):
        self.owner = make_owner()
        self.customer = make_customer()
        self.category = Category.objects.create(name='Hair')
        self.service = make_service(self.owner, self.category)
        UserProfile.objects.get_or_create(user=self.customer)
        UserProfile.objects.get_or_create(user=self.owner)

        with patch('apps.telegram_bot.service.send_message'):
            self.appointment = make_appointment(self.customer, self.owner, self.service)

    def test_owner_can_confirm_appointment(self):
        self.client.force_authenticate(user=self.owner)

        with patch('apps.telegram_bot.service.send_message'):
            response = self.client.put(
                f'/api/appointments/{self.appointment.id}/status/',
                {'status': 'confirmed'},
                format='json',
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, 'confirmed')

    def test_owner_can_complete_appointment(self):
        self.appointment.status = 'confirmed'
        with patch('apps.telegram_bot.service.send_message'):
            self.appointment.save()

        self.client.force_authenticate(user=self.owner)

        with patch('apps.telegram_bot.service.send_message'):
            response = self.client.put(
                f'/api/appointments/{self.appointment.id}/status/',
                {'status': 'completed'},
                format='json',
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, 'completed')

    def test_customer_can_cancel_own_appointment(self):
        self.client.force_authenticate(user=self.customer)

        with patch('apps.telegram_bot.service.send_message'):
            response = self.client.post(
                f'/api/appointments/{self.appointment.id}/cancel/',
                {'reason': 'Change of plans'},
                format='json',
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, 'cancelled')

    def test_customer_cannot_update_status_directly(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.put(
            f'/api/appointments/{self.appointment.id}/status/',
            {'status': 'confirmed'},
            format='json',
        )

        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])


class TelegramNotificationTests(APITestCase):
    """Signal sends Telegram messages on appointment lifecycle events.

    We test the signal handler directly so we can control the telegram_chat_id
    on the mock instances without relying on ORM reverse-relation caching.
    """

    def _build_mock_appointment(self, customer_chat_id, owner_chat_id, service_name='Haircut'):
        customer = MagicMock()
        customer.get_full_name.return_value = 'Test Customer'
        customer.email = 'customer@example.com'

        owner = MagicMock()
        owner.get_full_name.return_value = 'Test Owner'
        owner.id = 1

        try:
            customer.profile.telegram_chat_id = customer_chat_id
        except AttributeError:
            pass

        try:
            owner.profile.telegram_chat_id = owner_chat_id
            owner.profile.business_name = 'Test Salon'
        except AttributeError:
            pass

        service = MagicMock()
        service.name = service_name

        appt = MagicMock()
        appt.customer = customer
        appt.business_owner = owner
        appt.service = service
        appt.service_id = 1
        appt.date = date.today()
        appt.start_time = time(10, 0)
        appt.status = 'pending'
        appt.business_owner_id = 1
        return appt

    def _call_signal(self, appt, created=True, old_status=None, new_status=None):
        from apps.appointments.signals import send_appointment_notification, capture_old_status

        if old_status is not None:
            appt._old_status = old_status
            appt.status = new_status

        send_appointment_notification(
            sender=Appointment,
            instance=appt,
            created=created,
        )

    def test_new_appointment_notifies_customer_and_owner(self):
        appt = self._build_mock_appointment('111222333', '444555666')

        with patch('apps.telegram_bot.service.send_message') as mock_send:
            self._call_signal(appt, created=True)

        chat_ids = [call.args[0] for call in mock_send.call_args_list]
        self.assertIn('111222333', chat_ids)
        self.assertIn('444555666', chat_ids)

    def test_confirmation_notifies_customer(self):
        appt = self._build_mock_appointment('111222333', None)
        appt._old_status = 'pending'
        appt.status = 'confirmed'

        with patch('apps.telegram_bot.service.send_message') as mock_send:
            self._call_signal(appt, created=False)

        chat_ids = [call.args[0] for call in mock_send.call_args_list]
        self.assertIn('111222333', chat_ids)

    def test_cancellation_notifies_customer_and_owner(self):
        appt = self._build_mock_appointment('111222333', '444555666')
        appt._old_status = 'confirmed'
        appt.status = 'cancelled'

        with patch('apps.telegram_bot.service.send_message') as mock_send:
            self._call_signal(appt, created=False)

        chat_ids = [call.args[0] for call in mock_send.call_args_list]
        self.assertIn('111222333', chat_ids)
        self.assertIn('444555666', chat_ids)

    def test_no_message_sent_when_no_customer_chat_id(self):
        appt = self._build_mock_appointment(None, '444555666')

        with patch('apps.telegram_bot.service.send_message') as mock_send:
            self._call_signal(appt, created=True)

        chat_ids = [call.args[0] for call in mock_send.call_args_list]
        self.assertNotIn(None, chat_ids)
        # Owner still gets notified
        self.assertIn('444555666', chat_ids)

    def test_no_message_if_status_unchanged(self):
        appt = self._build_mock_appointment('111222333', '444555666')
        appt._old_status = 'confirmed'
        appt.status = 'confirmed'

        with patch('apps.telegram_bot.service.send_message') as mock_send:
            self._call_signal(appt, created=False)

        mock_send.assert_not_called()


class AppointmentListFilterTests(APITestCase):
    def setUp(self):
        self.owner = make_owner()
        self.customer = make_customer()
        self.category = Category.objects.create(name='Hair')
        self.service = make_service(self.owner, self.category)
        UserProfile.objects.get_or_create(user=self.customer)
        UserProfile.objects.get_or_create(user=self.owner)

    def test_owner_sees_all_their_appointments(self):
        with patch('apps.telegram_bot.service.send_message'):
            make_appointment(self.customer, self.owner, self.service, time(9, 0))
            make_appointment(self.customer, self.owner, self.service, time(11, 0), 'confirmed')

        self.client.force_authenticate(user=self.owner)
        response = self.client.get('/api/appointments/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results') or response.data
        self.assertEqual(len(results), 2)

    def test_customer_only_sees_own_appointments(self):
        other_customer = make_customer(email='other@example.com')
        UserProfile.objects.get_or_create(user=other_customer)

        with patch('apps.telegram_bot.service.send_message'):
            make_appointment(self.customer, self.owner, self.service, time(9, 0))
            make_appointment(other_customer, self.owner, self.service, time(11, 0))

        self.client.force_authenticate(user=self.customer)
        response = self.client.get('/api/appointments/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results') or response.data
        self.assertEqual(len(results), 1)
