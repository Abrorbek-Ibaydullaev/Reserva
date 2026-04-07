from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_businessgalleryimage'),
    ]

    operations = [
        migrations.AddField(
            model_name='businessgalleryimage',
            name='image_type',
            field=models.CharField(
                choices=[('space', 'The Space'), ('portfolio', 'Portfolio')],
                default='space',
                max_length=20,
            ),
        ),
    ]
