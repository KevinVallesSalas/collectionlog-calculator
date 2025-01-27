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
            user_data = {'completed_items': []}  # Initialize as a list

            for tab_name, entries in collection_log_data.items():
                for entry_name, entry_data in entries.items():
                    for item in entry_data.get('items', []):
                        processed_data.append({
                            'id': item['id'],
                            'name': item['name'],
                            'obtained': item['obtained']
                        })
                        if item['obtained']:
                            user_data['completed_items'].append(item['id'])  # Append to the list

                    for kill_count in entry_data.get('killCount', []):
                        processed_data.append({
                            'name': kill_count['name'],
                            'amount': kill_count['amount']
                        })

            # Store user data in the session
            request.session['user_data'] = user_data

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
        
        # Retrieve time values and handle possible non-numeric responses
        time_to_exact = calculate_time_to_exact(activity_index, completions_per_hour, user_data)
        time_to_ei = calculate_time_to_ei(activity_index, completions_per_hour, user_data)
        time_to_next_log_slot = calculate_time_to_next_log_slot(activity_index, completions_per_hour, user_data)

        # Convert to float if valid, else handle accordingly
        time_to_exact = safe_float_conversion(time_to_exact)
        time_to_ei = safe_float_conversion(time_to_ei)
        time_to_next_log_slot = safe_float_conversion(time_to_next_log_slot)

        # Calculate fastest log slot, handle infinity cases
        fastest_log_slot = min(
            time_to_exact if time_to_exact != float('inf') else None,
            time_to_ei if time_to_ei != float('inf') else None,
            time_to_next_log_slot if time_to_next_log_slot != float('inf') else None,
            key=lambda x: (x is None, x)  # None first, then compare values
        )

        # Convert infinite values to None for JSON response
        if time_to_exact == float('inf'):
            time_to_exact = None
        if time_to_ei == float('inf'):
            time_to_ei = None
        if time_to_next_log_slot == float('inf'):
            time_to_next_log_slot = None
        if fastest_log_slot == float('inf'):
            fastest_log_slot = None

        return {
            'activity_index': activity_index,
            'activity_name': completion_rate.activity_name,
            'fastest_log_slot': fastest_log_slot,
            'droprate_neither': droprate_neither,
            'droprate_independent': droprate_independent,
            'time_to_exact': time_to_exact,
            'time_to_ei': time_to_ei,
            'time_to_next_log_slot': time_to_next_log_slot,
        }
    
    except CompletionRate.DoesNotExist:
        return {"error": "Data not available"}


def safe_float_conversion(value):
    """ Attempts to convert a value to float; returns inf if conversion fails. """
    try:
        # Attempt to convert to float, will raise ValueError if not convertible
        return float(value)
    except (ValueError, TypeError):
        # Return infinity if value is not convertible
        return float('inf')
    
@csrf_exempt
def calculate_all_completion_times(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        is_iron = data.get("is_iron", False)  # Get the iron mode from the request body
        completed_items = data.get("completed_items", [])  # Get the list of completed items

        user_data = {'completed_items': [int(item) for item in completed_items]}  # Convert to integers

        completion_times = []
        activities = CompletionRate.objects.values_list('activity_index', flat=True).distinct()

        for activity_index in activities:
            completion_data = calculate_completion_data(activity_index, is_iron, user_data)
            if "error" not in completion_data:
                completion_times.append(completion_data)

        return JsonResponse({'status': 'success', 'data': completion_times})

    return JsonResponse({'status': 'error', 'message': 'Invalid method'}, status=405)


def activity_map_status(request):
    # Fetch user data from the session
    user_data = request.session.get('user_data', {'completed_items': []})
    completed_items = user_data['completed_items']  # Unpack for easier access

    activity_map_items = []
    activity_maps = ActivityMap.objects.all()

    for item in activity_maps:
        is_completed = item.item_id in completed_items
        requires_previous = item.requires_previous
        previous_item_completed = (item.sequence - 1) in completed_items if item.sequence > 0 else True

        # Determine active status
        is_active = not is_completed and (previous_item_completed or not requires_previous)

        activity_map_items.append({
            'activity_name': item.activity_name,
            'item_name': item.item_name,
            'completed': is_completed,
            'requires_previous': requires_previous,
            'active': is_active,
            'activity_index': item.completion_rate.activity_index,
            'completions_per_hour': item.completions_per_hour,
            'additional_time_to_first_completion': item.additional_time_to_first_completion,
            'item_id': item.item_id,
            'exact': item.exact,
            'independent': item.independent,
            'drop_rate_attempts': item.drop_rate_attempts,
            'e_and_i': item.e_and_i,
            'e_only': item.e_only,
            'i_only': item.i_only,
            'neither_inverse': item.neither_inverse,
        })

    return JsonResponse({'status': 'success', 'data': activity_map_items})