from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.services.models import Category, Service
from apps.users.models import User


class AppointmentCreationPermissionsTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email='owner@example.com',
            password='testpass123',
            user_type='business_owner',
            first_name='Owner',
        )
        self.category = Category.objects.create(name='Hair')
        self.service = Service.objects.create(
            business_owner=self.owner,
            category=self.category,
            name='Haircut',
            description='Basic haircut',
            price='25.00',
            duration=60,
        )
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
