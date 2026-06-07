from datetime import time
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.schedules.models import BusinessHours, Employee, EmployeeWeeklyHours
from apps.services.models import Category, Service
from apps.users.models import UserProfile


User = get_user_model()


class Command(BaseCommand):
    help = "Seed the local New Life demo business, services, staff, and hours."

    def handle(self, *args, **options):
        category, _ = Category.objects.get_or_create(
            name="Hair Salon",
            defaults={
                "description": "Hair cutting, styling, and grooming services",
                "icon": "fas fa-cut",
                "is_predefined": True,
            },
        )

        owner, created = User.objects.get_or_create(
            email="newlife@example.com",
            defaults={
                "first_name": "New",
                "last_name": "Life",
                "phone_number": "+998901234567",
                "user_type": "business_owner",
                "is_verified": True,
            },
        )
        if created:
            owner.set_password("Demo12345")
            owner.save(update_fields=["password"])
        else:
            changed = False
            for field, value in {
                "first_name": "New",
                "last_name": "Life",
                "phone_number": "+998901234567",
                "user_type": "business_owner",
                "is_verified": True,
            }.items():
                if getattr(owner, field) != value:
                    setattr(owner, field, value)
                    changed = True
            if changed:
                owner.save()

        profile, _ = UserProfile.objects.get_or_create(user=owner)
        profile.business_name = "New Life"
        profile.city = "Tashkent"
        profile.address = "Yunusobod 7-mavze, 43"
        profile.business_address = "Yunusobod 7-mavze, 43"
        profile.business_phone = "+998901234567"
        profile.business_email = owner.email
        profile.business_description = "A friendly neighborhood barbershop for clean cuts and quick bookings."
        profile.latitude = Decimal("41.367260")
        profile.longitude = Decimal("69.289090")
        profile.save()

        service_specs = [
            {
                "name": "Barbershop 77",
                "description": "Classic barbershop haircut and styling.",
                "price": Decimal("32.00"),
                "duration": 15,
                "slug": "barbershop-77-new-life",
            },
            {
                "name": "Kids barber",
                "description": "Gentle haircut service for children.",
                "price": Decimal("10.00"),
                "duration": 30,
                "slug": "kids-barber-new-life",
            },
        ]
        services = []
        for spec in service_specs:
            service, _ = Service.objects.update_or_create(
                business_owner=owner,
                name=spec["name"],
                defaults={
                    "category": category,
                    "description": spec["description"],
                    "price": spec["price"],
                    "duration": spec["duration"],
                    "is_active": True,
                    "slug": spec["slug"],
                },
            )
            services.append(service)

        employee_user, employee_created = User.objects.get_or_create(
            email="tim.newlife@example.com",
            defaults={
                "first_name": "Tim",
                "last_name": "",
                "phone_number": "+998901234568",
                "user_type": "employee",
                "is_verified": True,
            },
        )
        if employee_created:
            employee_user.set_password("Demo12345")
            employee_user.save(update_fields=["password"])
        else:
            changed = False
            for field, value in {
                "first_name": "Tim",
                "last_name": "",
                "phone_number": "+998901234568",
                "user_type": "employee",
                "is_verified": True,
            }.items():
                if getattr(employee_user, field) != value:
                    setattr(employee_user, field, value)
                    changed = True
            if changed:
                employee_user.save()

        employee, _ = Employee.objects.update_or_create(
            business_owner=owner,
            user=employee_user,
            defaults={
                "position": "Barber",
                "bio": "Tim handles fast, clean cuts for adults and kids.",
                "is_active": True,
            },
        )
        employee.services.set(services)

        for day_of_week in range(7):
            is_open = day_of_week < 6
            BusinessHours.objects.update_or_create(
                business_owner=owner,
                day_of_week=day_of_week,
                defaults={
                    "is_open": is_open,
                    "opening_time": time(9, 0) if is_open else None,
                    "closing_time": time(18, 0) if is_open else None,
                    "is_24_hours": False,
                },
            )
            EmployeeWeeklyHours.objects.update_or_create(
                employee=employee,
                day_of_week=day_of_week,
                defaults={
                    "is_working": is_open,
                    "start_time": time(9, 0) if is_open else None,
                    "end_time": time(18, 0) if is_open else None,
                },
            )

        self.stdout.write(self.style.SUCCESS("Seeded New Life demo business data."))
