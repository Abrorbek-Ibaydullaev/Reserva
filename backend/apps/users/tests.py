from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User, UserProfile


class UserRegistrationTests(APITestCase):
    url = '/api/users/register/'

    def test_customer_registration_succeeds(self):
        response = self.client.post(self.url, {
            'email': 'customer@example.com',
            'password': 'StrongPass123!',
            'password2': 'StrongPass123!',
            'first_name': 'Alice',
            'last_name': 'Smith',
            'user_type': 'customer',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='customer@example.com').exists())

    def test_duplicate_email_rejected(self):
        User.objects.create_user(email='dup@example.com', password='pass', user_type='customer')

        response = self.client.post(self.url, {
            'email': 'dup@example.com',
            'password': 'StrongPass123!',
            'password2': 'StrongPass123!',
            'first_name': 'Bob',
            'last_name': 'Jones',
            'user_type': 'customer',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_mismatch_rejected(self):
        response = self.client.post(self.url, {
            'email': 'mismatch@example.com',
            'password': 'StrongPass123!',
            'password2': 'DifferentPass123!',
            'first_name': 'Bob',
            'last_name': 'Jones',
            'user_type': 'customer',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_business_owner_registration_succeeds(self):
        response = self.client.post(self.url, {
            'email': 'owner@example.com',
            'password': 'StrongPass123!',
            'password2': 'StrongPass123!',
            'first_name': 'Sarah',
            'last_name': 'Lee',
            'user_type': 'business_owner',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email='owner@example.com')
        self.assertEqual(user.user_type, 'business_owner')


class LoginTests(APITestCase):
    url = '/api/users/login/'

    def setUp(self):
        self.user = User.objects.create_user(
            email='login@example.com',
            password='testpass123',
            user_type='customer',
        )

    def test_valid_credentials_return_tokens(self):
        response = self.client.post(self.url, {
            'email': 'login@example.com',
            'password': 'testpass123',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)

    def test_wrong_password_rejected(self):
        response = self.client.post(self.url, {
            'email': 'login@example.com',
            'password': 'wrongpassword',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_nonexistent_email_rejected(self):
        response = self.client.post(self.url, {
            'email': 'nobody@example.com',
            'password': 'testpass123',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserMeTests(APITestCase):
    url = '/api/users/me/'

    def setUp(self):
        self.user = User.objects.create_user(
            email='me@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User',
            user_type='customer',
        )

    def test_unauthenticated_returns_401(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_returns_user_data(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'me@example.com')
        self.assertEqual(response.data['first_name'], 'Test')

    def test_update_name(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.put(self.url, {
            'first_name': 'Updated',
            'last_name': 'Name',
            'email': 'me@example.com',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Updated')


class TelegramLinkTests(APITestCase):
    url = '/api/users/telegram/'

    def setUp(self):
        self.user = User.objects.create_user(
            email='tg@example.com',
            password='testpass123',
            user_type='customer',
        )
        UserProfile.objects.get_or_create(user=self.user)

    def test_unauthenticated_returns_401(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_returns_link_and_connected_false_when_not_connected(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['connected'])

    def test_disconnect_clears_chat_id(self):
        profile = self.user.profile
        profile.telegram_chat_id = '123456789'
        profile.save()

        self.client.force_authenticate(user=self.user)
        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        profile.refresh_from_db()
        self.assertIsNone(profile.telegram_chat_id)
