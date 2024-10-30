import requests 
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from .models import Item, Tab, LogEntry, KillCount, CompletionRate, ActivityMap, CollectionLogItem
from .calculations import (
    calculate_effective_droprate_neither,
    calculate_effective_droprate_independent,
    calculate_time_to_exact,
    calculate_time_to_ei,
    calculate_time_to_next_log_slot,
)

@csrf_exempt
def upload_json(request):
    if request.method == 'POST':
        try:
            json_file = request.FILES['file']
            data = json.load(json_file)
            tabs_data = data.get('tabs', {})
            user_data = {'completed_items': set()}

            for tab_name, entries in tabs_data.items():
                for entry_name, entry_data in entries.items():
                    for item_data in entry_data.get('items', []):
                        if item_data['obtained']:
                            # Add completed item IDs to the user_data dictionary
                            user_data['completed_items'].add(item_data['id'])

            # Return user data along with a success message
            return JsonResponse({'status': 'success', 'user_data': user_data})
        
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

def calculate_completion_data(activity_index, is_iron=False, user_data=None):
    """ Helper function to calculate completion data for a given activity index, using main or iron rates. """
    try:
        completion_rate = CompletionRate.objects.get(activity_index=activity_index)
        completions_per_hour = (
            completion_rate.completions_per_hour_iron if is_iron else completion_rate.completions_per_hour_main
        )

        # Pass user_data to calculation functions
        droprate_neither = calculate_effective_droprate_neither(activity_index, user_data)
        droprate_independent = calculate_effective_droprate_independent(activity_index, user_data)
        time_to_exact = calculate_time_to_exact(activity_index, completions_per_hour, user_data)
        time_to_ei = calculate_time_to_ei(activity_index, completions_per_hour, user_data)
        time_to_next_log_slot = calculate_time_to_next_log_slot(activity_index, completions_per_hour, user_data)

        return {
            'activity_index': activity_index,
            'activity_name': completion_rate.activity_name,
            'droprate_neither': droprate_neither,
            'droprate_independent': droprate_independent,
            'time_to_exact': time_to_exact,
            'time_to_ei': time_to_ei,
            'time_to_next_log_slot': time_to_next_log_slot,
        }
    
    except CompletionRate.DoesNotExist:
        return {"error": "Data not available"}

def calculate_all_completion_times(request):
    is_iron = request.GET.get("is_iron", "false").lower() == "true"
    completed_items = request.GET.getlist("completed_items")  # Get list of completed items from query params

    user_data = {'completed_items': [int(item) for item in completed_items]}  # Convert to integers

    completion_times = []
    activities = CompletionRate.objects.values_list('activity_index', flat=True).distinct()

    for activity_index in activities:
        completion_data = calculate_completion_data(activity_index, is_iron, user_data)
        if "error" not in completion_data:
            completion_times.append(completion_data)

    return JsonResponse({'status': 'success', 'data': completion_times})

def activity_map_status(request):
    # Assuming user data is fetched dynamically from a previous function, e.g., through an uploaded JSON file
    user_data = {'completed_items': []}  # Initialize empty list for completed items

    # Check if there's any user data available
    if request.method == 'GET':
        # You can adjust this logic based on how you fetch the user data
        # Here, we simulate that data is being fetched from the database or from an earlier upload
        user_data = {'completed_items': list(CollectionLogItem.objects.filter(is_collected=True).values_list('item__item_id', flat=True))}

    activity_map_items = []
    activity_maps = ActivityMap.objects.all()

    for item in activity_maps:
        is_completed = item.item_id in user_data['completed_items']
        requires_previous = item.requires_previous
        previous_item_completed = (item.sequence - 1) in user_data['completed_items'] if item.sequence > 0 else True  # Check if previous item (by sequence) is completed

        # Determine active status
        is_active = not is_completed and (previous_item_completed or not requires_previous)

        activity_map_items.append({
            'activity_name': item.activity_name,
            'item_name': item.item_name,
            'completed': is_completed,
            'requires_previous': requires_previous,
            'active': is_active,
        })

    return JsonResponse({'status': 'success', 'data': activity_map_items})
