import requests
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.db.models import F
from django.db.models import Case, When, Value, FloatField
from django.db.models import ExpressionWrapper
import json
from .models import Item, Tab, LogEntry, KillCount, CompletionRate


@csrf_exempt
def upload_json(request):
    if request.method == 'POST':
        try:
            json_file = request.FILES['file']
            data = json.load(json_file)
            tabs_data = data.get('tabs', {})
            processed_data = []

            for tab_name, entries in tabs_data.items():
                for entry_name, entry_data in entries.items():
                    for item_data in entry_data.get('items', []):
                        processed_data.append({
                            'id': item_data['id'],
                            'name': item_data['name'],
                            'obtained': item_data['obtained']
                        })

                    for kill_data in entry_data.get('killCounts', []):
                        processed_data.append({
                            'name': kill_data['name'],
                            'amount': kill_data['amount']
                        })

            return JsonResponse({'status': 'success', 'data': processed_data})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    return JsonResponse({'status': 'error', 'message': 'Invalid method'}, status=405)

@csrf_exempt
def fetch_user_data(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')

            if not username:
                return JsonResponse({'status': 'error', 'message': 'Username is required'})

            response = requests.get(f"https://api.collectionlog.net/collectionlog/user/{username}")
            if response.status_code != 200:
                return JsonResponse({'status': 'error', 'message': 'Failed to fetch data from collectionlog.net'})

            collection_log_data = response.json().get('collectionLog', {}).get('tabs', {})
            processed_data = []

            for tab_name, entries in collection_log_data.items():
                for entry_name, entry_data in entries.items():
                    for item in entry_data.get('items', []):
                        processed_data.append({
                            'id': item['id'],
                            'name': item['name'],
                            'obtained': item['obtained']
                        })

                    for kill_count in entry_data.get('killCount', []):
                        processed_data.append({
                            'name': kill_count['name'],
                            'amount': kill_count['amount']
                        })

            return JsonResponse({'status': 'success', 'data': processed_data})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    return JsonResponse({'status': 'error', 'message': 'Invalid method'}, status=405)

def get_collection_log(request):
    items = Item.objects.all()
    data = [
        {
            'id': item.id,
            'name': item.name,
            'obtained': item.obtained,
        }
        for item in items
    ]

    return JsonResponse({'status': 'success', 'data': data})

def calculate_completion_rates(request):
    # Fetch user's obtained items from the collection log
    obtained_item_ids = Item.objects.filter(obtained=True).values_list('item_id', flat=True)

    # Prepare a list to store the completion times by activity
    completion_data = []

    # Query the CompletionRate data to calculate completion times
    completion_rates = CompletionRate.objects.all()

    for rate in completion_rates:
        # Determine the completion rate based on user type (main or iron)
        completions_per_hour = rate.completions_per_hour_main
        if request.GET.get('iron', 'false').lower() == 'true':
            completions_per_hour = rate.completions_per_hour_iron

        # Skip activities with zero completions per hour to avoid division by zero
        if completions_per_hour == 0:
            continue

        # Calculate base time to complete
        base_time = 1 / completions_per_hour
        extra_time = rate.extra_time_to_first_completion or 0
        total_time = base_time + extra_time

        # Filter only the items that are not yet obtained and are active
        incomplete_items = [
            item for item in rate.items.all()
            if item.item_id not in obtained_item_ids and item.active
        ]

        # Skip activities that are already fully completed
        if not incomplete_items:
            continue

        # Compile each activity’s completion data
        completion_data.append({
            'activity_name': rate.activity_name,
            'total_time': total_time,
            'notes': rate.notes,
            'incomplete_items': [
                {
                    'item_name': item.item_name,
                    'drop_rate_attempts': item.drop_rate_attempts,
                    'time_to_acquire': item.drop_rate_attempts / completions_per_hour
                }
                for item in incomplete_items
            ]
        })

    # Sort activities by the shortest total time to complete
    sorted_data = sorted(completion_data, key=lambda x: x['total_time'])

    return JsonResponse({'status': 'success', 'data': sorted_data})