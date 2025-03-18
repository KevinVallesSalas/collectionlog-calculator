import csv
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from log_importer.models import CompletionRate, ActivityMap

class Command(BaseCommand):
    help = """ 
    Import completion rates and item activity map from CSV files into the database.

    Steps to update the import:
    1. Export the Activity Map and Completion Rates as .csv from the Collection Log Adviser spreadsheet.
    2. Copy the exported files into the 'static' folder inside the Django project.
    3. Run this script using: python manage.py import_completion_rates
    """

    def safe_float(self, value, default=0.0):
        """ Convert a string to float safely, replacing empty or invalid values with a default. """
        try:
            return float(value.strip()) if value.strip() not in ["", "n/a", "None"] else default
        except ValueError:
            return default

    def handle(self, *args, **kwargs):
        static_dir = getattr(settings, "STATICFILES_DIRS", [os.path.join(settings.BASE_DIR, 'log_importer', 'static')])
        static_path = static_dir[0] if static_dir else os.path.join(settings.BASE_DIR, 'log_importer', 'static')

        completion_rates_path = os.path.join(static_path, 'completion_rates.csv')
        activity_map_path = os.path.join(static_path, 'activity_map.csv')

        # Ensure files exist
        if not os.path.exists(completion_rates_path):
            self.stdout.write(self.style.ERROR(f"File not found: {completion_rates_path}"))
            return
        if not os.path.exists(activity_map_path):
            self.stdout.write(self.style.ERROR(f"File not found: {activity_map_path}"))
            return

        # Clear previous data
        ActivityMap.objects.all().delete()
        CompletionRate.objects.all().delete()

        # Import completion rates
        with open(completion_rates_path, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                CompletionRate.objects.create(
                    activity_index=int(row['Index']),
                    activity_name=row['Activity name'].strip(),
                    completions_per_hour_main=self.safe_float(row['Completions/hr (main)']),
                    completions_per_hour_iron=self.safe_float(row['Completions/hr (iron)']),
                    extra_time_to_first_completion=self.safe_float(row['Extra time to first completion (hours)']),
                    notes=row.get('Notes', '').strip(),
                    verification_source=row.get('Verification source', '').strip()
                )

        # Import activity map
        with open(activity_map_path, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for sequence, row in enumerate(reader, start=1):
                try:
                    completion_rate = CompletionRate.objects.get(activity_index=int(row['Activity index']))
                    neither_inverse_value = self.safe_float(row.get('Neither^(-1)', '0'))

                    ActivityMap.objects.create(
                        completion_rate=completion_rate,
                        activity_name=row['Activity name'].strip(),
                        completions_per_hour=self.safe_float(row.get('Completions per hour', '0')),
                        additional_time_to_first_completion=self.safe_float(row.get('Additional time to first completion (hours)', '0')),
                        item_id=int(row['Item ID']),
                        item_name=row['Item name'].strip(),
                        requires_previous=row['Requires previous'].strip().lower() == 'true',
                        exact=row['Exact'].strip().lower() == 'true',
                        independent=row['Independent'].strip().lower() == 'true',
                        drop_rate_attempts=self.safe_float(row['Drop rate (attempts)']),
                        e_and_i=row.get('E&I', '').strip(),
                        e_only=row.get('E', '').strip(),
                        i_only=row.get('I', '').strip(),
                        neither_inverse=neither_inverse_value,
                        sequence=sequence
                    )
                except CompletionRate.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f"Activity index {row['Activity index']} not found in completion rates"))

        self.stdout.write(self.style.SUCCESS('Successfully imported completion rates and activity map'))
