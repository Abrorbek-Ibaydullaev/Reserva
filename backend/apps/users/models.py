from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import RegexValidator


class UserManager(BaseUserManager):
    """Define a model manager for User model with no username field."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        """Create and save a User with the given email and password."""
        if not email:
            raise ValueError('The given email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular User with the given email and password."""
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password, **extra_fields):
        """Create and save a SuperUser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Custom User model."""

    USER_TYPE_CHOICES = (
        ('customer', 'Customer'),
        ('business_owner', 'Business Owner'),
        ('employee', 'Employee'),
        ('admin', 'Admin'),
    )

    username = None  # Remove username field
    email = models.EmailField(unique=True)
    user_type = models.CharField(
        max_length=20, choices=USER_TYPE_CHOICES, default='customer')
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone_number = models.CharField(
        validators=[phone_regex], max_length=17, blank=True)
    profile_picture = models.ImageField(
        upload_to='profile_pics/', blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Stripe customer ID for payment processing
    stripe_customer_id = models.CharField(
        max_length=255, blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email


class UserProfile(models.Model):
    """Extended user profile information."""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)

    # For business owners
    business_name = models.CharField(max_length=255, blank=True, null=True)
    business_address = models.TextField(blank=True, null=True)
    business_phone = models.CharField(max_length=17, blank=True, null=True)
    business_email = models.EmailField(blank=True, null=True)
    business_website = models.URLField(blank=True, null=True)
    business_description = models.TextField(blank=True, null=True)

    # Social media links
    facebook = models.URLField(blank=True, null=True)
    instagram = models.URLField(blank=True, null=True)
    twitter = models.URLField(blank=True, null=True)
    linkedin = models.URLField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email}'s Profile"


class BusinessGalleryImage(models.Model):
    """Gallery images uploaded by business owners for their public page."""

    IMAGE_TYPE_CHOICES = (
        ('space', 'The Space'),
        ('portfolio', 'Portfolio'),
    )

    business_owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='gallery_images')
    image = models.ImageField(upload_to='business_gallery/')
    image_type = models.CharField(max_length=20, choices=IMAGE_TYPE_CHOICES, default='space')
    caption = models.CharField(max_length=200, blank=True, null=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"Gallery image for {self.business_owner.email}"


class Notification(models.Model):
    """User notification system."""

    NOTIFICATION_TYPES = (
        ('appointment_confirmation', 'Appointment Confirmation'),
        ('appointment_reminder', 'Appointment Reminder'),
        ('appointment_cancellation', 'Appointment Cancellation'),
        ('new_message', 'New Message'),
        ('review_request', 'Review Request'),
        ('promotion', 'Promotion'),
        ('system', 'System Notification'),
    )

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(
        max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.user.email}"
