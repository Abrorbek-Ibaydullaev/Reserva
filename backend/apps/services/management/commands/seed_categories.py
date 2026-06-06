# apps/services/management/commands/seed_categories.py
from django.core.management.base import BaseCommand
from apps.services.models import Category


class Command(BaseCommand):
    help = 'Seeds the database with top 20 pre-defined service categories'

    def handle(self, *args, **kwargs):
        categories = [
            {'name': 'Hair Salon', 'icon': 'fas fa-cut', 'description': 'Hair cutting, styling, and coloring'},
            {'name': 'Nails', 'icon': 'fas fa-nail', 'description': 'Manicure and pedicure services'},
            {'name': 'Massage', 'icon': 'fas fa-spa', 'description': 'Therapeutic and relaxation massage'},
            {'name': 'Fitness', 'icon': 'fas fa-dumbbell', 'description': 'Personal training and fitness classes'},
            {'name': 'Yoga', 'icon': 'fas fa-om', 'description': 'Yoga classes and instruction'},
            {'name': 'Health & Wellness', 'icon': 'fas fa-heartbeat', 'description': 'Medical and wellness services'},
            {'name': 'Dental', 'icon': 'fas fa-tooth', 'description': 'Dental care and orthodontics'},
            {'name': 'Therapy', 'icon': 'fas fa-brain', 'description': 'Mental health and counseling'},
            {'name': 'Education', 'icon': 'fas fa-graduation-cap', 'description': 'Tutoring and educational services'},
            {'name': 'Music Lessons', 'icon': 'fas fa-music', 'description': 'Music instruction and coaching'},
            {'name': 'Photography', 'icon': 'fas fa-camera', 'description': 'Photo sessions and editing'},
            {'name': 'Home Cleaning', 'icon': 'fas fa-broom', 'description': 'Cleaning and housekeeping'},
            {'name': 'Plumbing', 'icon': 'fas fa-wrench', 'description': 'Plumbing repairs and installation'},
            {'name': 'Electrical', 'icon': 'fas fa-bolt', 'description': 'Electrical repairs and installation'},
            {'name': 'Consulting', 'icon': 'fas fa-briefcase', 'description': 'Business and professional consulting'},
            {'name': 'Legal Services', 'icon': 'fas fa-gavel', 'description': 'Legal advice and representation'},
            {'name': 'Accounting', 'icon': 'fas fa-calculator', 'description': 'Accounting and tax services'},
            {'name': 'Beauty & Makeup', 'icon': 'fas fa-makeup', 'description': 'Makeup application and beauty services'},
            {'name': 'Pet Grooming', 'icon': 'fas fa-dog', 'description': 'Pet grooming and care'},
            {'name': 'Car Detailing', 'icon': 'fas fa-car', 'description': 'Car cleaning and detailing'},
        ]

        for cat_data in categories:
            obj, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'icon': cat_data['icon'],
                    'description': cat_data['description'],
                    'is_predefined': True
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(
                    f"Created category: {obj.name}"))
            else:
                self.stdout.write(f"Category already exists: {obj.name}")
