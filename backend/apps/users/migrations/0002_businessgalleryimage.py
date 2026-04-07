from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='BusinessGalleryImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='business_gallery/')),
                ('caption', models.CharField(blank=True, max_length=200, null=True)),
                ('order', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('business_owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='gallery_images', to='users.user')),
            ],
            options={
                'ordering': ['order', 'created_at'],
            },
        ),
    ]
