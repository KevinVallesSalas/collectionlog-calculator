import csv
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from log_importer.models import CompletionRate, ActivityMap

class Command(BaseCommand):
    help = 'Import completion rates and item activity map from CSV files into the database'

    def handle(self, *args, **kwargs):
        # Define paths to the CSV files
        completion_rates_path = os.path.join(settings.BASE_DIR, 'log_importer', 'static', 'completion_rates.csv')
        activity_map_path = os.path.join(settings.BASE_DIR, 'log_importer', 'static', 'activity_map.csv')

        # Clear previous data
        ActivityMap.objects.all().delete()
        CompletionRate.objects.all().delete()

        # Importing completion rates data
        with open(completion_rates_path, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                CompletionRate.objects.create(
                    activity_index=int(row['Index']),
                    activity_name=row['Activity name'],
                    completions_per_hour_main=float(row['Completions/hr (main)']),
                    completions_per_hour_iron=float(row['Completions/hr (iron)']),
                    extra_time_to_first_completion=float(row['Extra time to first completion (hours)']),
                    notes=row.get('Notes', ''),
                    verification_source=row.get('Verification source', '')
                )

        # Importing item activity map data
        with open(activity_map_path, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for sequence, row in enumerate(reader, start=1):  # sequence starts at 1
                try:
                    # Find associated CompletionRate by activity_index
                    completion_rate = CompletionRate.objects.get(activity_index=int(row['Activity index']))

                    # Check for 'n/a' or empty values in 'Neither^(-1)' field
                    neither_inverse_value = None
                    if row['Neither^(-1)'] not in ['n/a', '', None]:
                        neither_inverse_value = float(row['Neither^(-1)'])

                    # Ignore 'active' as it will be calculated dynamically
                    ActivityMap.objects.create(
                        completion_rate=completion_rate,  # ForeignKey to CompletionRate
                        activity_name=row['Activity name'],
                        completions_per_hour=float(row['Completions per hour']),
                        additional_time_to_first_completion=float(row['Additional time to first completion (hours)']),
                        item_id=int(row['Item ID']),
                        item_name=row['Item name'],
                        requires_previous=row['Requires previous'].lower() == 'true',
                        exact=row['Exact'].lower() == 'true',
                        independent=row['Independent'].lower() == 'true',
                        drop_rate_attempts=float(row['Drop rate (attempts)']),
                        e_and_i=row.get('E&I', ''),
                        e_only=row.get('E', ''),
                        i_only=row.get('I', ''),
                        neither_inverse=neither_inverse_value,
                        sequence=sequence  # Track the row order in sequence field
                    )
                except CompletionRate.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f"Activity index {row['Activity index']} not found in completion rates"))

        self.stdout.write(self.style.SUCCESS('Successfully imported completion rates and activity map'))
