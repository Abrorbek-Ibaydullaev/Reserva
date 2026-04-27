from rest_framework import status
from rest_framework.test import APITestCase

from apps.schedules.models import BusinessHours, Employee, ensure_default_business_hours
from apps.services.models import Category, Service
from apps.users.models import User


class BusinessHoursTests(APITestCase):
    url = '/api/schedules/business-hours/'

    def setUp(self):
        self.owner = User.objects.create_user(
            email='hours_owner@example.com',
            password='testpass123',
            user_type='business_owner',
        )
        ensure_default_business_hours(self.owner)

    def test_authenticated_owner_gets_7_days_of_hours(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results') or response.data
        self.assertEqual(len(results), 7)

    def test_owner_can_update_a_day(self):
        self.client.force_authenticate(user=self.owner)
        hours = BusinessHours.objects.filter(business_owner=self.owner).first()

        response = self.client.put(f'{self.url}{hours.id}/', {
            'day_of_week': hours.day_of_week,
            'is_open': False,
            'is_24_hours': False,
            'opening_time': None,
            'closing_time': None,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        hours.refresh_from_db()
        self.assertFalse(hours.is_open)

    def test_unauthenticated_cannot_update_hours(self):
        hours = BusinessHours.objects.filter(business_owner=self.owner).first()

        response = self.client.put(f'{self.url}{hours.id}/', {
            'day_of_week': hours.day_of_week,
            'is_open': False,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_owner_only_sees_own_hours(self):
        other = User.objects.create_user(
            email='other_hours@example.com',
            password='testpass123',
            user_type='business_owner',
        )
        ensure_default_business_hours(other)

        self.client.force_authenticate(user=self.owner)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results') or response.data
        owner_ids = set(BusinessHours.objects.filter(business_owner=self.owner).values_list('id', flat=True))
        for item in results:
            self.assertIn(item['id'], owner_ids)


class EmployeeManagementTests(APITestCase):
    url = '/api/schedules/employees/'

    def setUp(self):
        self.owner = User.objects.create_user(
            email='emp_owner@example.com',
            password='testpass123',
            user_type='business_owner',
            first_name='Owner',
        )
        self.category = Category.objects.create(name='Hair-Emp')
        self.service = Service.objects.create(
            business_owner=self.owner,
            category=self.category,
            name='Haircut-Emp',
            price='25.00',
            duration=60,
        )

    def test_owner_can_create_employee(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(self.url, {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john_doe_emp@example.com',
            'password': 'StrongPass123!',
            'position': 'Barber',
            'service_ids': [self.service.id],
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Employee.objects.filter(
            business_owner=self.owner,
            user__email='john_doe_emp@example.com',
        ).exists())

    def test_owner_can_list_own_employees(self):
        emp_user = User.objects.create_user(
            email='emp_list@example.com',
            password='pass',
            user_type='employee',
        )
        Employee.objects.create(
            business_owner=self.owner,
            user=emp_user,
            position='Stylist',
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results') or response.data
        self.assertGreaterEqual(len(results), 1)
        emails = [e['user_details']['email'] for e in results if e.get('user_details')]
        self.assertIn('emp_list@example.com', emails)

    def test_owner_can_delete_employee(self):
        emp_user = User.objects.create_user(
            email='emp_del@example.com',
            password='pass',
            user_type='employee',
        )
        employee = Employee.objects.create(
            business_owner=self.owner,
            user=emp_user,
            position='Stylist',
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(f'{self.url}{employee.id}/')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Employee.objects.filter(id=employee.id).exists())

    def test_unauthenticated_cannot_list_employees(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
