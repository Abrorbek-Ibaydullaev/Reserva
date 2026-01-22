from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class Category(models.Model):
    """Service categories (Hair, Nails, Massage, etc.)"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True,
                            null=True)  # Font Awesome icon class
    image = models.ImageField(
        upload_to='category_images/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']

    def __str__(self):
        return self.name


class Service(models.Model):
    """Individual services offered by businesses."""

    DURATION_CHOICES = (
        (15, '15 minutes'),
        (30, '30 minutes'),
        (45, '45 minutes'),
        (60, '1 hour'),
        (90, '1.5 hours'),
        (120, '2 hours'),
        (180, '3 hours'),
    )

    business_owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='services')
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, related_name='services')
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration = models.IntegerField(choices=DURATION_CHOICES, default=60)
    is_active = models.BooleanField(default=True)
    max_capacity = models.IntegerField(
        default=1, help_text="Maximum number of clients for this service at one time")
    requires_confirmation = models.BooleanField(default=False)
    cancellation_policy_hours = models.IntegerField(
        default=24, help_text="Hours before appointment when cancellation is allowed")

    # Images
    thumbnail = models.ImageField(
        upload_to='service_thumbnails/', blank=True, null=True)
    images = models.JSONField(default=list, blank=True,
                              help_text="List of image URLs")

    # SEO fields
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    meta_title = models.CharField(max_length=200, blank=True, null=True)
    meta_description = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        unique_together = ['business_owner', 'name']

    def __str__(self):
        return f"{self.name} - ${self.price}"

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class ServiceImage(models.Model):
    """Additional images for services."""
    service = models.ForeignKey(
        Service, on_delete=models.CASCADE, related_name='service_images')
    image = models.ImageField(upload_to='service_images/')
    caption = models.CharField(max_length=200, blank=True, null=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Image for {self.service.name}"


class ServiceReview(models.Model):
    """Customer reviews for services."""
    service = models.ForeignKey(
        Service, on_delete=models.CASCADE, related_name='reviews')
    customer = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='service_reviews')
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 to 5"
    )
    comment = models.TextField()
    is_verified = models.BooleanField(
        default=False, help_text="Verified purchase")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['service', 'customer']

    def __str__(self):
        return f"{self.customer.email} - {self.rating} stars for {self.service.name}"


class ServiceAddon(models.Model):
    """Additional options for services."""
    service = models.ForeignKey(
        Service, on_delete=models.CASCADE, related_name='addons')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration = models.IntegerField(default=15, help_text="Additional minutes")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - +${self.price}"
