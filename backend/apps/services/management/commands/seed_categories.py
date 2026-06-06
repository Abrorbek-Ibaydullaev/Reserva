# apps/services/management/commands/seed_categories.py
from django.core.management.base import BaseCommand
from apps.services.models import Category


class Command(BaseCommand):
    help = 'Seeds the database with top 20 pre-defined service categories'

    def handle(self, *args, **kwargs):
        categories = [
            {
                'name': 'Hair Salon',
                'icon': 'fas fa-cut',
                'description': 'Hair cutting, styling, and coloring',
                'svg_icon': 'icons/icon_01.svg',
            },
            {
                'name': 'Nails',
                'icon': 'fas fa-nail',
                'description': 'Manicure and pedicure services',
                'svg_icon': 'icons/icon_02.svg',
            },
            {
                'name': 'Massage',
                'icon': 'fas fa-spa',
                'description': 'Therapeutic and relaxation massage',
                'svg_icon': 'icons/icon_03.svg',
            },
            {
                'name': 'Fitness',
                'icon': 'fas fa-dumbbell',
                'description': 'Personal training and fitness classes',
                'svg_icon': 'icons/icon_04.svg',
            },
            {
                'name': 'Yoga',
                'icon': 'fas fa-om',
                'description': 'Yoga classes and instruction',
                'svg_icon': 'icons/icon_06.svg',
            },
            {
                'name': 'Health & Wellness',
                'icon': 'fas fa-heartbeat',
                'description': 'Medical and wellness services',
                'svg_icon': 'icons/icon_12.svg',
            },
            {
                'name': 'Dental',
                'icon': 'fas fa-tooth',
                'description': 'Dental care and orthodontics',
                'svg_icon': 'icons/icon_08.svg',
            },
            {
                'name': 'Therapy',
                'icon': 'fas fa-brain',
                'description': 'Mental health and counseling',
                'svg_icon': 'icons/icon_14.svg',
            },
            {
                'name': 'Education',
                'icon': 'fas fa-graduation-cap',
                'description': 'Tutoring and educational services',
                'svg_icon': 'icons/icon_15.svg',
            },
            {
                'name': 'Music Lessons',
                'icon': 'fas fa-music',
                'description': 'Music instruction and coaching',
                'svg_icon': 'icons/icon_11.svg',
            },
            {
                'name': 'Photography',
                'icon': 'fas fa-camera',
                'description': 'Photo sessions and editing',
                'svg_icon': 'icons/icon_10.svg',
            },
            {
                'name': 'Home Cleaning',
                'icon': 'fas fa-broom',
                'description': 'Cleaning and housekeeping',
                'svg_icon': 'icons/icon_19.svg',
            },
            {
                'name': 'Plumbing',
                'icon': 'fas fa-wrench',
                'description': 'Plumbing repairs and installation',
                'svg_icon': 'icons/icon_25.svg',
            },
            {
                'name': 'Electrical',
                'icon': 'fas fa-bolt',
                'description': 'Electrical repairs and installation',
                'svg_icon': 'icons/icon_27.svg',
            },
            {
                'name': 'Consulting',
                'icon': 'fas fa-briefcase',
                'description': 'Business and professional consulting',
                'svg_icon': 'icons/icon_28.svg',
            },
            {
                'name': 'Legal Services',
                'icon': 'fas fa-gavel',
                'description': 'Legal advice and representation',
                'svg_icon': 'icons/icon_07.svg',
            },
            {
                'name': 'Accounting',
                'icon': 'fas fa-calculator',
                'description': 'Accounting and tax services',
                'svg_icon': 'icons/icon_31.svg',
            },
            {
                'name': 'Beauty & Makeup',
                'icon': 'fas fa-makeup',
                'description': 'Makeup application and beauty services',
                'svg_icon': 'icons/icon_32.svg',
            },
            {
                'name': 'Pet Grooming',
                'icon': 'fas fa-dog',
                'description': 'Pet grooming and care',
                'svg_icon': 'icons/icon_32.svg',
            },
            {
                'name': 'Car Detailing',
                'icon': 'fas fa-car',
                'description': 'Car cleaning and detailing',
                'svg_icon': 'icons/icon_33.svg',
            },
        ]

        for cat in categories:
            obj, created = Category.objects.update_or_create(
                name=cat['name'],
                defaults={
                    'icon': cat['icon'],
                    'description': cat['description'],
                    'svg_icon': cat['svg_icon'],
                    'is_predefined': True,
                },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created category: {obj.name}"))
            else:
                self.stdout.write(f"Updated category: {obj.name}")
