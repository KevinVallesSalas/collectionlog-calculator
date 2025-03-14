# Generated by Django 5.1.2 on 2024-10-30 02:24

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('log_importer', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='activitymap',
            name='activity_index',
        ),
        migrations.AddField(
            model_name='activitymap',
            name='completion_rate',
            field=models.ForeignKey(default=2, on_delete=django.db.models.deletion.CASCADE, related_name='activity_maps', to='log_importer.completionrate'),
            preserve_default=False,
        ),
    ]
