# Generated by Django 5.1.2 on 2024-10-30 03:08

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('log_importer', '0003_remove_activitymap_completed'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='activitymap',
            name='active',
        ),
    ]
