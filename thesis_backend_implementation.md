# 4 Backend Implementation

The backend for the Reserva appointment booking platform was built using Django, a
high-level Python web framework that encourages rapid development and clean, pragmatic
design. The architecture follows a modular monolith pattern: the system is deployed as a
single process, but each functional domain — users, services, scheduling, appointments,
and notifications — is encapsulated in an independent Django application. This approach
was chosen as a trade-off between the simplicity of a monolith and the separation of
concerns normally associated with microservices, making the codebase easier to extend
without requiring separate deployments.

The system is built on several core technologies. Django REST Framework (DRF) provides
the serialization layer, generic view classes, and permission system for all API endpoints.
JSON Web Tokens via the `djangorestframework-simplejwt` library handle stateless
authentication, replacing Django's default session-based system. `django-cors-headers`
manages cross-origin requests from the React frontend. Pillow processes image uploads
for profile pictures, service thumbnails, and business gallery images. Configuration and
secret management is handled through a `.env` file loaded at startup, keeping credentials
out of source code. The development database is SQLite, which can be swapped for
PostgreSQL in production by changing a single environment variable.

---

## 4.1 Data Modeling Approach

The database schema is organized around four main entity groups that reflect the core
business domain: users and their profiles, the service catalog, scheduling and employee
management, and appointments. The design prioritizes data integrity through database-
level constraints alongside model-level validators, ensuring invalid data is rejected at
multiple layers before it can reach persistent storage.

### 4.1.1 User Model (Core Entity)

```python
class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('customer',       'Customer'),
        ('business_owner', 'Business Owner'),
        ('employee',       'Employee'),
        ('admin',          'Admin'),
    )

    username     = None
    email        = models.EmailField(unique=True, max_length=254)
    user_type    = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='customer')
    phone_number = models.CharField(validators=[phone_regex], max_length=17, blank=True)
    is_verified  = models.BooleanField(default=False)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = []
    objects = UserManager()
```

Several important design decisions shape this model. The `username` field is removed
entirely and replaced with `email` as the login identifier, which eliminates the need for
users to invent a username and reduces registration friction. The email field is capped
at 254 characters in accordance with RFC 5321, and the `unique=True` constraint
ensures no two accounts share the same address. The `user_type` field drives role-based
access control throughout the entire backend — the same API endpoint returns different
data depending on whether the caller is a `customer`, `business_owner`, or `employee`,
making a single field responsible for the entire authorization model. Passwords are never
stored in plain text; they are hashed using Django's default PBKDF2-SHA256 algorithm
inside the custom `UserManager.create_user()` method. The `is_verified` flag tracks
account verification status, reserving space for a future email confirmation flow without
requiring a schema migration.

### 4.1.2 UserProfile Model (Extended Entity)

```python
class UserProfile(models.Model):
    user            = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio             = models.TextField(blank=True, null=True)
    city            = models.CharField(max_length=100, blank=True, null=True)
    latitude        = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude       = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    business_name   = models.CharField(max_length=255, blank=True, null=True)
    business_phone  = models.CharField(max_length=17, blank=True, null=True)
    telegram_chat_id = models.CharField(max_length=50, blank=True, null=True)
```

The `UserProfile` is deliberately separated from `User` rather than adding these fields
to the authentication table. This separation of concerns keeps the authentication model
lean — it only contains credentials and permissions — while the profile table holds all
extended biographical, business, and social information. The `OneToOneField` with
`on_delete=CASCADE` ensures that deleting a user automatically removes their profile,
preventing orphaned records. Geolocation coordinates use `DecimalField` with six decimal
places, which provides precision to approximately 0.1 metres — sufficient for map-based
business discovery. The `telegram_chat_id` field is the linking field for the notification
system: it is populated when the user connects their Telegram account and is queried on
every appointment event to route push notifications.

### 4.1.3 Service Model (Catalog Entity)

```python
class Service(models.Model):
    DURATION_CHOICES = (
        (15, '15 minutes'), (30, '30 minutes'), (45, '45 minutes'),
        (60, '1 hour'),     (90, '1.5 hours'),  (120, '2 hours'),  (180, '3 hours'),
    )

    business_owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='services')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2,
                                                   validators=[MinValueValidator(0.01)])
    duration = models.IntegerField(choices=DURATION_CHOICES, default=60)
    max_capacity = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    requires_confirmation = models.BooleanField(default=False)
    cancellation_policy_hours = models.IntegerField(default=24)

    class Meta:
        unique_together = ['business_owner', 'name']
        constraints = [
            CheckConstraint(condition=Q(price__gt=0),         name='service_price_positive'),
            CheckConstraint(condition=Q(max_capacity__gte=1), name='service_max_capacity_min_1'),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
```

Several structural choices govern this model's integrity and usability. Duration is stored
as an integer (minutes) using a predefined set of choices ranging from 15 to 180 minutes;
this constrained vocabulary prevents nonsensical durations while keeping the field simple
to query and compare during slot generation. Price and capacity constraints are enforced
at two levels simultaneously — through field validators (which catch errors in the API
layer before a database call is made) and through database-level `CheckConstraint` objects
(which enforce the rule at the SQL layer as a last resort). The `unique_together` constraint
on `['business_owner', 'name']` prevents duplicate service names within a single business
without preventing two different businesses from offering a service with the same name.
The `slug` field is auto-populated from the service name on first save using Django's
`slugify()` utility, enabling SEO-friendly URLs without requiring the business owner to
manually enter a URL-safe identifier. The `requires_confirmation` flag allows businesses
to choose between instant booking (the appointment is confirmed immediately) and
manual approval (it stays in pending state until the owner reviews it).

### 4.1.4 Appointment Model (Transactional Entity)
4
```python
class Appointment(models.Model):
    STATUS_CHOICES = (
        ('pending',     'Pending'),
        ('confirmed',   'Confirmed'),
        ('completed',   'Completed'),
        ('cancelled',   'Cancelled'),
        ('no_show',     'No Show'),
        ('rescheduled', 'Rescheduled'),
    )

    appointment_number = models.CharField(max_length=50, unique=True, default=uuid.uuid4)
    customer           = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments')
    business_owner     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='business_appointments')
    service            = models.ForeignKey(Service, on_delete=models.CASCADE)
    employee           = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True)
    date               = models.DateField()
    start_time         = models.TimeField()
    end_time           = models.TimeField()
    status             = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    service_price      = models.DecimalField(max_digits=10, decimal_places=2)
    addons_total       = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_amount         = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount    = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount       = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        indexes = [
            models.Index(fields=['appointment_number']),
            models.Index(fields=['customer', 'date']),
            models.Index(fields=['business_owner', 'date']),
            models.Index(fields=['status']),
        ]

    def save(self, *args, **kwargs):
        if not self.end_time and self.start_time and self.duration:
            start_datetime = datetime.combine(self.date, self.start_time)
            self.end_time = (start_datetime + timedelta(minutes=self.duration)).time()
        self.total_amount = (
            float(self.service_price) + float(self.addons_total)
            + float(self.tax_amount) - float(self.discount_amount)
        )
        super().save(*args, **kwargs)
```

Key structural and performance decisions inform this model's design. The `appointment_number`
uses a UUID default, which generates a globally unique identifier without a sequential
pattern — this prevents enumeration attacks where an attacker might increment an integer
ID to access other users' bookings. The financial breakdown is split into four separate
fields (`service_price`, `addons_total`, `tax_amount`, `discount_amount`) rather than
storing only a single total; this preserves the full pricing audit trail and allows the
business owner to see exactly what each line item contributed to the final charge.
The `total_amount` is computed and stored in the `save()` method rather than as a
database-computed column, keeping the calculation logic portable across database engines.
The `end_time` is also auto-calculated from `start_time` and `duration` if not supplied,
so the caller only needs to specify when the appointment starts. Database indexes on
`['customer', 'date']`, `['business_owner', 'date']`, and `['status']` directly reflect
the most common query patterns — customer appointment lists, business owner dashboards,
and status-filtered views — reducing full-table scans for the highest-traffic operations.

### 4.1.5 Scheduling Models

```python
class BusinessHours(models.Model):
    business_owner = models.ForeignKey(User, on_delete=models.CASCADE)
    day_of_week    = models.IntegerField(choices=DAYS_OF_WEEK)   # 0=Monday … 6=Sunday
    is_open        = models.BooleanField(default=True)
    opening_time   = models.TimeField(blank=True, null=True)
    closing_time   = models.TimeField(blank=True, null=True)
    is_24_hours    = models.BooleanField(default=False)

    class Meta:
        unique_together = ['business_owner', 'day_of_week']

class Employee(models.Model):
    business_owner        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='employees')
    user                  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='employee_profiles')
    services              = models.ManyToManyField(Service, related_name='employees', blank=True)
    max_daily_appointments = models.IntegerField(default=10)
    appointment_buffer    = models.IntegerField(default=15)

    class Meta:
        unique_together = ['business_owner', 'user']

class EmployeeTimeOff(models.Model):
    TIME_OFF_TYPES  = (('vacation','Vacation'), ('sick','Sick Leave'),
                       ('personal','Personal Day'), ('other','Other'))
    STATUS_CHOICES  = (('pending','Pending'), ('approved','Approved'),
                       ('rejected','Rejected'), ('cancelled','Cancelled'))
    employee        = models.ForeignKey(Employee, on_delete=models.CASCADE)
    time_off_type   = models.CharField(max_length=20, choices=TIME_OFF_TYPES)
    start_date      = models.DateField()
    end_date        = models.DateField()
    is_all_day      = models.BooleanField(default=True)
    status          = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
```

The scheduling domain requires three interacting layers of models to accurately represent
real-world availability. `BusinessHours` provides the outer boundary — the hours during
which the business is open at all. The `unique_together` constraint on
`['business_owner', 'day_of_week']` enforces exactly one record per day per business,
preventing conflicting schedules. `Employee` is deliberately linked to `User` via two
separate foreign keys: `business_owner` identifies which business the employee belongs
to, and `user` points to the employee's own login account, allowing employees to
authenticate independently and view their own schedule. The `ManyToManyField` to
`Service` controls which services each employee can perform, enabling the availability
algorithm to assign only qualified staff to a booking. The `appointment_buffer` field
reserves a gap between consecutive appointments (in minutes), preventing back-to-back
bookings without any preparation time. `EmployeeTimeOff` has a four-state approval
workflow because only `approved` leave records block availability — pending or rejected
requests are ignored during slot generation, allowing the system to function without
requiring immediate manager approval for every leave request submitted.

---

## 4.2 Database Initialization and Migrations

```python
# config/settings.py — AUTH_USER_MODEL override
AUTH_USER_MODEL = 'users.User'

# Applied once per environment to create all tables
python manage.py migrate

# Seed the 20 predefined service categories
python manage.py seed_categories
```

The system relies on Django's built-in migration framework to manage schema creation
and evolution. Each model change generates a versioned migration file that can be applied
forward or rolled back, maintaining full version control of the database schema. The
`AUTH_USER_MODEL` setting is declared before any migrations are run, pointing Django to
the custom `User` model; this must be set at project initialization because changing it
after the first migration requires a full database reset. Service categories are seeded
using a custom management command that uses `get_or_create()` — this makes the
command idempotent, meaning it can be run multiple times without creating duplicate
records. The `is_predefined=True` flag set during seeding marks these as platform-owned
categories, which the admin interface checks before allowing deletion.

---

## 4.3 Authentication System Configuration

```python
# config/settings.py
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS':  False,
    'ALGORITHM':              'HS256',
    'SIGNING_KEY':            SECRET_KEY,
    'AUTH_HEADER_TYPES':      ('Bearer',),
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
}
```

The security configuration balances protection with usability through several deliberate
choices. The access token lifetime of one hour limits the window during which a stolen
token can be misused, while the seven-day refresh token reduces the need for users to
re-authenticate frequently. The HMAC-SHA256 (`HS256`) signing algorithm is used rather
than RSA because the backend is a single service — there is no need for asymmetric
signatures that allow third parties to verify tokens without a shared secret. The
`AUTH_HEADER_TYPES = ('Bearer',)` setting enforces the standard Authorization header
format expected by the React frontend. `SessionAuthentication` is kept as a secondary
backend specifically to support the Django Admin interface, which uses cookie-based
sessions, without requiring a JWT login flow for administrative access.

### 4.3.1 User Registration

```python
class UserRegistrationSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(**validated_data)
```

The registration serializer implements several protective mechanisms to ensure data
integrity and security. Input validation is enforced by Django's built-in `validate_password`
utility, which rejects passwords that are too short, too common, or entirely numeric
before any database operation is attempted. The `password2` confirmation field is marked
`write_only=True`, ensuring it is never included in serialized responses and never
reaches the database layer. The `validate()` method performs cross-field validation to
confirm both password inputs match, returning a structured error message that the
frontend can map to the correct form field. Password hashing is delegated entirely to
`User.objects.create_user()`, which applies PBKDF2-SHA256 — plain text passwords
are never stored. The `password2` key is removed from `validated_data` before the
`create_user()` call, so the manager only receives fields that map to model attributes.

### 4.3.2 Auto-Profile Creation

```python
# apps/users/signals.py
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
```

The Django signal system is used to guarantee that every `User` record has an associated
`UserProfile` without requiring the API caller or the registration view to manage it
explicitly. The `post_save` signal fires automatically after every successful `User.save()`
call. The `created` flag distinguishes a new record from an update — the profile is only
created on the first save. The second signal ensures that any subsequent update to the
`User` object also propagates a save to the profile, keeping both records synchronized.
This approach eliminates the possibility of an orphaned user account without a profile,
which would cause `AttributeError` exceptions anywhere the code accesses `user.profile`.

---

## 4.4 Service Management

### 4.4.1 Category Seeding

```python
class Command(BaseCommand):
    help = 'Seeds the database with top 20 pre-defined service categories'

    def handle(self, *args, **kwargs):
        categories = [
            {'name': 'Hair Salon',    'icon': 'fas fa-cut',      'description': 'Hair cutting, styling, and coloring'},
            {'name': 'Nails',         'icon': 'fas fa-nail',     'description': 'Manicure and pedicure services'},
            {'name': 'Massage',       'icon': 'fas fa-spa',      'description': 'Therapeutic and relaxation massage'},
            {'name': 'Fitness',       'icon': 'fas fa-dumbbell', 'description': 'Personal training and fitness classes'},
            {'name': 'Dental',        'icon': 'fas fa-tooth',    'description': 'Dental care and orthodontics'},
            {'name': 'Photography',   'icon': 'fas fa-camera',   'description': 'Photo sessions and editing'},
            {'name': 'Home Cleaning', 'icon': 'fas fa-broom',    'description': 'Cleaning and housekeeping'},
            # ... 13 more categories
        ]
        for cat_data in categories:
            obj, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={'icon': cat_data['icon'],
                          'description': cat_data['description'],
                          'is_predefined': True}
            )
```

The category seeding approach embodies several practical decisions for platform
management. Using a management command rather than a data migration separates
seed data from schema changes, keeping migration history clean and focused on
structural changes only. The `get_or_create()` pattern makes the command fully
idempotent — repeated execution produces no side effects, which is important during
deployment pipelines that may run setup commands multiple times. The `is_predefined`
flag is set to `True` for all seeded records, which the `CategoryAdmin` class checks
to prevent deletion or modification through the admin interface. This protects the
category taxonomy from accidental changes while still allowing operators to view them.
Font Awesome icon identifiers are stored alongside each category to enable consistent
iconography in the frontend without hardcoding UI resources in the React codebase.

### 4.4.2 Service Creation Endpoint

```python
class MyServiceListCreateView(generics.ListCreateAPIView):
    serializer_class   = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Service.objects.filter(business_owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(business_owner=self.request.user)
```

The service creation view demonstrates the role-enforcement pattern used throughout
the backend. The `get_queryset()` method filters results to the authenticated user's
own services, ensuring business owners cannot list or modify services belonging to
other businesses — even if they guess a valid service ID. The `perform_create()` hook
injects `business_owner` from the request rather than accepting it from the request
body; this prevents a malicious actor from creating a service under a different owner's
account by manipulating the POST payload. The view is restricted to `IsAuthenticated`
rather than `IsAuthenticatedOrReadOnly` because all write and list operations on this
endpoint require a business owner account — unauthenticated browsing of services is
handled by a separate public endpoint.

---

## 4.5 Scheduling and Availability System

### 4.5.1 Default Hours Initialization

```python
DEFAULT_BUSINESS_HOURS = {
    0: (True,  time(9, 0),  time(18, 0)),   # Monday
    1: (True,  time(9, 0),  time(18, 0)),   # Tuesday
    2: (True,  time(9, 0),  time(18, 0)),   # Wednesday
    3: (True,  time(9, 0),  time(18, 0)),   # Thursday
    4: (True,  time(9, 0),  time(18, 0)),   # Friday
    5: (True,  time(10, 0), time(16, 0)),   # Saturday (shorter hours)
    6: (False, None, None),                 # Sunday (closed)
}

def ensure_default_business_hours(business_owner):
    if BusinessHours.objects.filter(business_owner=business_owner).exists():
        return
    for day_of_week, (is_open, opening_time, closing_time) in DEFAULT_BUSINESS_HOURS.items():
        BusinessHours.objects.create(
            business_owner=business_owner, day_of_week=day_of_week,
            is_open=is_open, opening_time=opening_time, closing_time=closing_time,
        )
```

The lazy initialization pattern for business hours addresses a critical onboarding issue.
Without it, a newly registered business owner would have no hours configured and
customers would see no available slots — effectively making the platform unusable until
the owner manually completed their setup. By calling `ensure_default_business_hours()`
at the point of first query rather than at registration time, the system provides a
sensible working schedule immediately while still allowing owners to override it. The
default values (Monday–Friday 09:00–18:00, Saturday 10:00–16:00, Sunday closed)
reflect typical service business patterns in Uzbekistan. The guard clause at the start
of the function checks for existing records first, ensuring the initialization is applied
only once and never overwrites customized hours.

### 4.5.2 Employee Availability Logic

```python
def employee_matches_slot(employee, target_date, slot_start, slot_end):
    date_specific_schedule_exists = EmployeeSchedule.objects.filter(
        employee=employee, date=target_date,
    ).exists()

    if date_specific_schedule_exists:
        return EmployeeSchedule.objects.filter(
            employee=employee, date=target_date,
            start_time__lte=slot_start, end_time__gte=slot_end,
            is_available=True,
        ).exists()

    ensure_default_employee_weekly_hours(employee)
    weekly_hours = EmployeeWeeklyHours.objects.filter(
        employee=employee, day_of_week=target_date.weekday(),
    ).first()

    if not weekly_hours or not weekly_hours.is_working:
        return False

    return weekly_hours.start_time <= slot_start and weekly_hours.end_time >= slot_end
```

This function implements a two-tier priority system for resolving employee availability.
A date-specific `EmployeeSchedule` record always takes precedence over the recurring
`EmployeeWeeklyHours` template. This design allows businesses to model irregular
shifts — for example, an employee covering an extra day or working shorter hours on
a specific date — without altering their standing weekly schedule. The function first
checks whether any date-specific record exists for the target date; only if none exists
does it fall back to the weekly hours. The `weekday()` method maps a Python `date`
object to an integer (0 = Monday, 6 = Sunday), matching the integer encoding used in
both `BusinessHours` and `EmployeeWeeklyHours`. The function is used as the core
primitive by both the single-slot availability check and the bulk slot generation
algorithm, ensuring consistent availability logic across the entire scheduling system.

### 4.5.3 Availability Check

```python
class CheckAvailabilityView(APIView):
    def post(self, request):
        # 1. Check business hours
        business_hours = BusinessHours.objects.get(
            business_owner=service.business_owner, day_of_week=date.weekday()
        )
        if not business_hours.is_open:
            return Response({'available': False, 'message': 'Business is closed on this day'})
        if start_time < business_hours.opening_time or end_time > business_hours.closing_time:
            return Response({'available': False, 'message': 'Outside business hours'})

        # 2. Check employee schedule and time-off
        if not employee_matches_slot(employee, date, start_time, end_time):
            return Response({'available': False, 'message': 'Employee not available at this time'})

        time_off = EmployeeTimeOff.objects.filter(
            employee=employee, start_date__lte=date, end_date__gte=date, status='approved'
        )
        if has_time_off_overlap(time_off, start_time, end_time):
            return Response({'available': False, 'message': 'Employee is on time off'})

        # 3. Check for conflicting appointments
        conflict = Appointment.objects.filter(
            employee=employee, date=date,
            status__in=['confirmed', 'pending'],
            start_time__lt=end_time, end_time__gt=start_time
        ).exists()
        if conflict:
            return Response({'available': False, 'message': 'Employee has conflicting appointment'})

        return Response({'available': True, 'message': 'Time slot is available'})
```

The availability check applies validation rules in a deliberate sequence from coarsest
to finest granularity, returning early at the first failure to minimize database queries.
Business hours are checked first because they are the most restrictive constraint and
require only a single database lookup. Employee schedule and time-off checks come
second, using `status='approved'` to filter out pending leave requests — only formally
approved absences block availability. The appointment conflict check uses an overlap
condition (`start_time__lt=end_time AND end_time__gt=start_time`) rather than checking
exact equality, which correctly identifies any partial overlap between the requested slot
and an existing booking. Only `confirmed` and `pending` appointments are considered
as conflicts; `cancelled` and `no_show` records no longer block the calendar. The
response format returns a consistent `{ available, message }` object regardless of which
check fails, giving the frontend a uniform structure to handle.

### 4.5.4 Available Slot Generation

```python
class AvailableTimeSlotsView(APIView):
    def get(self, request):
        # Step 1 — Generate all candidate slots within business hours
        current_time = business_hours.opening_time
        while current_time < business_hours.closing_time:
            end_time = (datetime.combine(date, current_time) +
                        timedelta(minutes=slot_duration)).time()
            if end_time > business_hours.closing_time:
                break
            time_slots.append({'date': date, 'start_time': current_time, 'end_time': end_time})
            current_time = (datetime.combine(date, current_time) +
                            timedelta(minutes=15)).time()

        # Step 2 — Remove past slots if today
        if date == timezone.localdate():
            time_slots = [s for s in time_slots if s['start_time'] > current_local_time]

        # Step 3 — Filter by employee availability, time-off, and appointment conflicts
        for slot in time_slots:
            if employee_matches_slot(...) and not has_time_off_overlap(...) and not conflict:
                available_slots.append(slot)

        return Response({'slots': serializer.data, 'reason': reason})
```

The slot generation algorithm makes several performance and usability trade-offs. Candidate
slots are generated at 15-minute intervals regardless of service duration; this means a
60-minute service can start at 09:00, 09:15, 09:30, and so on, giving customers maximum
flexibility in choosing their appointment time. If the service duration itself were used
as the step interval, customers would see fewer options and the calendar would appear
less available than it actually is. Slots in the past are filtered out when the requested
date is today, preventing customers from booking appointments that have already passed.
When no specific employee is requested, the algorithm checks the entire pool of eligible
employees for each slot and marks the slot as available if at least one employee is free —
this approach maximizes the number of available slots shown to the customer without
over-booking any individual staff member. The response always includes a `reason` field
that is populated only when the returned `slots` list is empty, giving the frontend a
human-readable explanation (e.g. "Business is closed on this day") to display rather
than a generic empty state.

---

## 4.6 Appointment Booking System

### 4.6.1 Appointment Creation

```python
class AppointmentListCreateView(generics.ListCreateAPIView):
    def perform_create(self, serializer):
        serializer.save(
            customer=self.request.user,
            business_owner=service.business_owner,
        )
```

```python
# Appointment.save() — auto-calculates end_time and total_amount
def save(self, *args, **kwargs):
    if not self.end_time and self.start_time and self.duration:
        start_datetime = datetime.combine(self.date, self.start_time)
        self.end_time = (start_datetime + timedelta(minutes=self.duration)).time()

    self.total_amount = (
        float(self.service_price) + float(self.addons_total)
        + float(self.tax_amount) - float(self.discount_amount)
    )
    super().save(*args, **kwargs)
```

The appointment creation design minimizes the data the customer must submit by
computing derived fields automatically. The `end_time` is calculated from `start_time`
and `duration` in the model's `save()` method, so the API caller only needs to specify
when the appointment starts; the system determines when it ends. The financial total
is recalculated on every save, so it remains consistent even if individual price components
are updated after initial creation. The `appointment_number` is generated from a UUID
and truncated to 8 uppercase characters, producing a short human-readable reference
(e.g. `A3F7BC12`) suitable for customer confirmations and support queries. The `business_owner`
is injected from `service.business_owner` rather than accepted from the request body,
preventing customers from creating an appointment under a business they did not select.

### 4.6.2 Status Management and Audit Trail

```python
class AppointmentHistory(models.Model):
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='history')
    changed_by  = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    from_status = models.CharField(max_length=20, blank=True, null=True)
    to_status   = models.CharField(max_length=20)
    notes       = models.TextField(blank=True, null=True)
    created_at  = models.DateTimeField(auto_now_add=True)

class AppointmentCancellation(models.Model):
    appointment  = models.OneToOneField(Appointment, on_delete=models.CASCADE)
    cancelled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    reason       = models.ForeignKey(CancellationReason, on_delete=models.SET_NULL, null=True)
    custom_reason = models.TextField(blank=True, null=True)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
```

The audit trail design provides complete traceability for every appointment event.
`AppointmentHistory` records every status change with its `from_status` and `to_status`
values, the user who triggered the change, and an optional note. Using `SET_NULL` for
`changed_by` rather than `CASCADE` means the history record survives even if the user
account is later deleted, preserving the audit trail for accountability purposes.
`AppointmentCancellation` uses a `OneToOneField` rather than `ForeignKey`, enforcing
that exactly one cancellation record can exist per appointment — a cancelled appointment
cannot be cancelled again. The `reason` field accepts either a predefined `CancellationReason`
record (for common reasons like "schedule conflict" or "personal reason") or a free-text
`custom_reason`, giving flexibility without requiring the business to maintain an exhaustive
predefined list. The `refund_amount` field tracks how much was refunded independently
of the original `total_amount`, supporting partial refund scenarios.

---

## 4.7 Notification System and Telegram Integration

### 4.7.1 Account Linking

```python
# apps/telegram_bot/service.py

def make_link_token(user_id):
    secret = settings.SECRET_KEY.encode()
    sig = hmac.new(secret, str(user_id).encode(), hashlib.sha256).hexdigest()
    return f"{user_id}-{sig[:16]}"

def verify_link_token(token):
    try:
        user_id_str, sig = token.rsplit('-', 1)
        user_id = int(user_id_str)
        expected_sig = make_link_token(user_id).rsplit('-', 1)[1]
        if hmac.compare_digest(sig, expected_sig):
            return user_id
    except Exception:
        pass
    return None

def get_telegram_link(user_id):
    token = make_link_token(user_id)
    return f'https://t.me/{bot_username}?start={token}'
```

The account linking mechanism achieves secure authentication without requiring a
separate OAuth flow or storing one-time codes in the database. The token is constructed
from the user's database ID concatenated with the first 16 characters of an HMAC-SHA256
signature computed using the Django `SECRET_KEY` as the signing secret. This design
means the token is self-verifying — the server can reconstruct and compare the expected
signature without any database lookup, making token validation a pure in-memory
operation. `hmac.compare_digest()` is used instead of the `==` operator for the
signature comparison; this prevents timing attacks, where an attacker could measure
response time differences to incrementally guess the correct signature one character
at a time. If the token is valid, the bot writes the Telegram `chat_id` to
`UserProfile.telegram_chat_id`, after which all appointment notifications for that
user are routed to their Telegram account.

### 4.7.2 Notification Dispatch via Django Signals

```python
# apps/appointments/signals.py

@receiver(pre_save, sender=Appointment)
def capture_old_status(sender, instance, **kwargs):
    if instance.pk:
        try:
            instance._old_status = Appointment.objects.get(pk=instance.pk).status
        except Appointment.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None

@receiver(post_save, sender=Appointment)
def send_appointment_notification(sender, instance, created, **kwargs):
    from apps.telegram_bot.service import send_message

    customer_chat = _get_chat_id(instance.customer)
    owner_chat    = _get_chat_id(instance.business_owner)

    if created:
        if customer_chat:
            send_message(customer_chat,
                f"📅 <b>Booking received!</b>\n\n<b>{service_name}</b>\n"
                f"📍 {business_name}\n🗓 {date_str} at {time_str}\n\n"
                f"Your appointment is pending confirmation.")
        if owner_chat:
            send_message(owner_chat,
                f"🔔 <b>New booking!</b>\n\n<b>{customer_name}</b> booked "
                f"<b>{service_name}</b>\n🗓 {date_str} at {time_str}")
        return

    old_status = getattr(instance, '_old_status', None)
    new_status = instance.status
    if old_status == new_status:
        return

    if new_status == 'confirmed':
        if customer_chat:
            send_message(customer_chat,
                f"✅ <b>Appointment confirmed!</b>\n\n<b>{service_name}</b>\n"
                f"📍 {business_name}\n🗓 {date_str} at {time_str}\n\nSee you there!")

    elif new_status == 'cancelled':
        if customer_chat:
            send_message(customer_chat, f"❌ <b>Appointment cancelled</b>...")
        if owner_chat:
            send_message(owner_chat, f"❌ <b>Appointment cancelled</b>...")

    elif new_status == 'completed':
        if customer_chat:
            send_message(customer_chat,
                f"⭐ <b>How was your visit?</b>\n\nYou just completed "
                f"<b>{service_name}</b> at {business_name}.",
                buttons=[('✍️ Leave a Review', review_url), ('📅 Rebook', rebook_url)])
```



The signal-based notification architecture decouples the notification logic from the
appointment views entirely. The views are responsible only for changing appointment
state; the signals observe those changes and dispatch notifications as a side effect.
This separation means that notifications fire consistently regardless of which part of
the code triggers an appointment save — the admin interface, a view, or a management
command. The two-signal pattern (`pre_save` capturing `_old_status`, `post_save`
comparing it to the new status) is necessary because after `save()` completes, the
previous status is no longer available in the database. The guard `if old_status == new_status: return`
prevents duplicate notifications when an appointment is saved without a status change.
The `completed` notification includes two Telegram inline keyboard buttons — "Leave a
Review" and "Rebook" — implemented using the `buttons` parameter of `send_message()`,
which maps the list of `(label, url)` tuples to Telegram's `inline_keyboard` reply markup
format. All `send_message()` calls are wrapped in exception handling inside the `_api()`
helper, ensuring that a Telegram API failure never propagates an exception into the
appointment save transaction.

### 4.7.3 The Telegram Bot Process

```python
# apps/telegram_bot/management/commands/run_telegram_bot.py

class Command(BaseCommand):
    def handle(self, *args, **options):
        while True:
            # Weekly report scheduler — every Sunday at 23:59
            now = datetime.datetime.now()
            if (now.weekday() == 6 and now.hour == 23 and now.minute == 59
                    and last_report_date != now.date()):
                send_all_reports()
                last_report_date = now.date()

            # Long-polling for incoming messages
            updates = get_updates(offset)
            for update in updates:
                handle_update(update)
                offset = update['update_id'] + 1
```

The bot runs as a Django management command using Telegram's long-polling API
(`getUpdates` with a 30-second timeout) rather than webhooks. This choice simplifies
development and testing since no public HTTPS endpoint is needed — the bot connects
outward to Telegram's servers rather than waiting for inbound connections. The polling
loop doubles as a scheduler: every Sunday at 23:59 it generates and dispatches a
weekly summary report to each connected business owner. The `last_report_date` variable
prevents the report from being sent multiple times within the same minute. The `/start <token>`
command handler uses `verify_link_token()` to authenticate the linking request and
writes the `telegram_chat_id` to the user's profile on success, completing the account
linking flow initiated from the web application.

---

## 4.8 Admin Interface

```python
# apps/users/admin.py
class UserAdmin(BaseUserAdmin):
    list_display    = ('email', 'first_name', 'last_name', 'user_type', 'is_staff', 'is_verified')
    list_filter     = ('user_type', 'is_staff', 'is_superuser', 'is_verified')
    search_fields   = ('email', 'first_name', 'last_name', 'phone_number')
    ordering        = ('email',)
    readonly_fields = ('created_at', 'updated_at', 'last_login')
    inlines         = [UserProfileInline]

# apps/services/admin.py
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    readonly_fields = ('name', 'description', 'icon', 'image', 'is_predefined')

    def has_add_permission(self, request):             return False
    def has_delete_permission(self, request, obj=None): return False
    def has_change_permission(self, request, obj=None): return True
```

The admin configuration is adapted to enforce the platform's data ownership rules
at the operator level. Because the custom `User` model removes the `username` field,
the standard `UserAdmin` class cannot be used — the custom `UserAdmin` reconfigures
the fieldsets and `add_fieldsets` to use `email` as the primary identifier throughout.
The `UserProfileInline` renders all profile fields, including business details and social
links, directly within the user record page so operators can inspect the full user without
navigating to a separate URL. Auto-managed timestamps (`created_at`, `updated_at`)
are declared `readonly_fields` to prevent operators from falsifying record dates. The
`CategoryAdmin` enforces the predefined category protection by overriding all three
permission methods — `has_add_permission`, `has_delete_permission`, and
`has_change_permission` — to make categories viewable but not modifiable or deletable
through the admin interface. `ServiceAdmin` uses `TabularInline` for images, add-ons,
and reviews, allowing all related records for a service to be inspected and managed on
a single admin page without requiring separate navigation.

---

## 4.9 Configuration and Security

```python
# config/settings.py

def load_env_file(path):
    if not path.exists():
        return
    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

load_env_file(BASE_DIR / '.env')

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-...')
DEBUG      = os.getenv('DEBUG', 'True').lower() == 'true'
DATABASES  = {
    'default': {
        'ENGINE': os.getenv('DB_ENGINE', 'django.db.backends.sqlite3'),
        'NAME':   db_name,
    }
}
TELEGRAM_BOT_TOKEN    = os.getenv('TELEGRAM_BOT_TOKEN', '')
TELEGRAM_BOT_USERNAME = os.getenv('TELEGRAM_BOT_USERNAME', '')
```

The configuration management approach keeps all sensitive values out of source code
and out of version control. A custom `load_env_file()` function reads the `.env` file
at startup and injects each key-value pair into `os.environ` using `setdefault()` —
this means environment variables already present in the shell (for example, variables
injected by a CI/CD pipeline or a container orchestrator) take precedence over the
`.env` file, allowing the same codebase to be deployed across development, staging,
and production environments without code changes. The database engine and name are
configurable via `DB_ENGINE` and `DB_NAME`, making it possible to switch from SQLite
to PostgreSQL for production by changing two environment variables. Django's four
built-in `AUTH_PASSWORD_VALIDATORS` are all active, enforcing minimum length, common
password detection, numeric-only rejection, and similarity to personal information — these
are applied at the serializer layer via `validate_password` before any database write
occurs. CORS headers are managed by `django-cors-headers` middleware, which is listed
first in `MIDDLEWARE` to ensure it can add the necessary response headers before any
other middleware processes the request.

---

<!-- ============================================================
  EDITOR NOTES — remove before submitting
  ============================================================
  [ ] Section 4.1 — Insert ER diagram after 4.1.5 (after all models
      are introduced). Recommended tool: dbdiagram.io or draw.io.

  [ ] Section 4.6.2 — Insert appointment status state diagram
      (pending → confirmed → completed / cancelled / no_show /
      rescheduled). A simple box-and-arrow diagram in draw.io works.

  [ ] Section 4.7.2 — Full signal message strings are slightly
      shortened. Replace "..." placeholders with the full strings
      from apps/appointments/signals.py if your university requires
      exact code reproduction.

  [ ] Check your university's citation format for file path
      references (e.g. apps/schedules/views.py) — some require
      appendix references or footnotes instead of inline paths.
  ============================================================ -->
