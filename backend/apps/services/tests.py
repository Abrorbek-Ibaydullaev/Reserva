from rest_framework import status
from rest_framework.test import APITestCase

from apps.services.models import Category, Service
from apps.users.models import User


class ServiceListTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email='owner@example.com',
            password='testpass123',
            user_type='business_owner',
            first_name='Owner',
        )
        self.category = Category.objects.create(name='Hair-Test')
        self.service = Service.objects.create(
            business_owner=self.owner,
            category=self.category,
            name='HaircutTest',
            description='Classic haircut',
            price='30.00',
            duration=60,
            is_active=True,
        )

    def test_public_list_includes_our_active_service(self):
        response = self.client.get(f'/api/services/?business_owner={self.owner.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results') or response.data
        names = [s['name'] for s in results]
        self.assertIn('HaircutTest', names)

    def test_inactive_service_excluded_from_list(self):
        self.service.is_active = False
        self.service.save()

        response = self.client.get(f'/api/services/?business_owner={self.owner.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results'] if 'results' in response.data else response.data
        names = [s['name'] for s in results]
        self.assertNotIn('HaircutTest', names)


class BusinessOwnerServiceTests(APITestCase):
    url = '/api/services/my-services/'

    def setUp(self):
        self.owner = User.objects.create_user(
            email='owner2@example.com',
            password='testpass123',
            user_type='business_owner',
        )
        self.other_owner = User.objects.create_user(
            email='other2@example.com',
            password='testpass123',
            user_type='business_owner',
        )
        self.category = Category.objects.create(name='Nails-Test')

    def test_unauthenticated_returns_401(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_owner_can_create_service(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(self.url, {
            'name': 'Manicure',
            'description': 'Classic manicure',
            'price': '20.00',
            'duration': 45,
            'category': self.category.id,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Service.objects.filter(name='Manicure', business_owner=self.owner).exists())

    def test_owner_only_sees_own_services(self):
        Service.objects.create(
            business_owner=self.owner,
            category=self.category,
            name='My Service',
            price='10.00',
            duration=30,
        )
        Service.objects.create(
            business_owner=self.other_owner,
            category=self.category,
            name='Other Service',
            price='10.00',
            duration=30,
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results') or response.data
        names = [s['name'] for s in results]
        self.assertIn('My Service', names)
        self.assertNotIn('Other Service', names)

    def test_owner_can_update_own_service(self):
        service = Service.objects.create(
            business_owner=self.owner,
            category=self.category,
            name='Old Name',
            price='15.00',
            duration=30,
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.put(f'{self.url}{service.id}/', {
            'name': 'New Name',
            'description': 'Updated',
            'price': '25.00',
            'duration': 30,
            'category': self.category.id,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        service.refresh_from_db()
        self.assertEqual(service.name, 'New Name')

    def test_owner_cannot_modify_other_owners_service(self):
        other_service = Service.objects.create(
            business_owner=self.other_owner,
            category=self.category,
            name='Protected',
            price='15.00',
            duration=30,
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.put(f'{self.url}{other_service.id}/', {
            'name': 'Hacked',
            'price': '1.00',
            'duration': 30,
            'category': self.category.id,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_owner_can_delete_own_service(self):
        service = Service.objects.create(
            business_owner=self.owner,
            category=self.category,
            name='To Delete',
            price='10.00',
            duration=30,
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(f'{self.url}{service.id}/')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Service.objects.filter(id=service.id).exists())
