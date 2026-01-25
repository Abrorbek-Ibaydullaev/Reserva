# apps/services/management/commands/seed_categories.py
from django.core.management.base import BaseCommand
from apps.services.models import Category


class Command(BaseCommand):
    help = 'Seeds the database with initial service categories'

    def handle(self, *args, **kwargs):
        categories = [
            {'name': 'Beauty & Hair', 'icon': 'fas fa-cut',
                'description': 'Salons and styling'},
            {'name': 'Health', 'icon': 'fas fa-heartbeat',
                'description': 'Medical and wellness'},
            {'name': 'Fitness', 'icon': 'fas fa-dumbbell',
                'description': 'Training and classes'},
            {'name': 'Professional', 'icon': 'fas fa-briefcase',
                'description': 'Consulting and legal'},
            {'name': 'Spa', 'icon': 'fas fa-spa',
                'description': 'Massage and relaxation'},
            {'name': 'Education', 'icon': 'fas fa-graduation-cap',
                'description': 'Tutoring and lessons'},
            {'name': 'Home Services', 'icon': 'fas fa-home',
                'description': 'Repairs and cleaning'},
        ]

        for cat_data in categories:
            obj, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'icon': cat_data['icon'],
                    'description': cat_data['description']
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(
                    f"Created category: {obj.name}"))
            else:
                self.stdout.write(f"Category already exists: {obj.name}")
