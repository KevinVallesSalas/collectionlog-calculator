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
def handle_collection_log(request):
    if request.method == 'POST':
        try:
            if 'file' in request.FILES:
                # Handle file upload
                json_file = request.FILES['file']
                data = json.load(json_file)

                # Set default values for manual uploads
                username = "Manual Upload"
                account_type = "Unknown"
            else:
                # Handle API fetch
                request_data = json.loads(request.body)
                username = request_data.get('username')

                if not username:
                    return JsonResponse({'status': 'error', 'message': 'Username is required'})

                response = requests.get(f"https://api.collectionlog.net/collectionlog/user/{username}")
                if response.status_code != 200:
                    return JsonResponse({'status': 'error', 'message': 'Failed to fetch data from collectionlog.net'})

                data = response.json().get('collectionLog', {})
                account_type = data.get("accountType", "Unknown")

            # Extract relevant data
            unique_obtained = data.get("uniqueObtained", 0)
            unique_items = data.get("uniqueItems", 0)
            tabs_data = data.get("tabs", {})

            # Define core sections
            sections = {
                "Bosses": {},
                "Raids": {},
                "Clues": {},
                "Minigames": {},
                "Other": {}
            }

            # Predefined Clue order
            clue_order = [
                "Beginner Treasure Trails",
                "Easy Treasure Trails",
                "Medium Treasure Trails",
                "Hard Treasure Trails",
                "Elite Treasure Trails",
                "Master Treasure Trails",
                "Hard Treasure Trails (Rare)",
                "Elite Treasure Trails (Rare)",
                "Master Treasure Trails (Rare)",
                "Shared Treasure Trail Rewards"
            ]

            # Process all tabs into sections
            for tab_name, tab_entries in tabs_data.items():
                section = sections.get(tab_name, sections["Other"])

                for entry_name, entry_data in tab_entries.items():
                    if entry_name not in section:
                        section[entry_name] = []

                    # Handle different formats (API has "items", manual upload may have direct lists)
                    if isinstance(entry_data, dict) and "items" in entry_data:
                        section[entry_name].extend(entry_data["items"])
                    elif isinstance(entry_data, list):
                        section[entry_name].extend(entry_data)

            # Sort sections: Alphabetical except Clues
            sorted_sections = {}
            for section, entries in sections.items():
                if section == "Clues":
                    sorted_clues = {clue: sections["Clues"].get(clue, []) for clue in clue_order if clue in sections["Clues"]}
                    unknown_clues = {k: v for k, v in sections["Clues"].items() if k not in clue_order}
                    sorted_clues.update(unknown_clues)
                    sorted_sections["Clues"] = sorted_clues
                else:
                    sorted_sections[section] = dict(sorted(entries.items()))

            # Final structured data
            final_data = {
                "username": username,
                "accountType": account_type,
                "uniqueObtained": unique_obtained,
                "uniqueItems": unique_items,
                "sections": sorted_sections
            }

            return JsonResponse({'status': 'success', 'data': final_data})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})

    return JsonResponse({'status': 'error', 'message': 'Invalid method'}, status=405)


def get_collection_log(request):
    """ Fetches all collection log items and their obtained status. """
    items = Item.objects.all()
    data = [{'id': item.id, 'name': item.name, 'obtained': item.obtained} for item in items]
    
    return JsonResponse({'status': 'success', 'data': data})


def calculate_completion_data(activity_index, is_iron=False, user_data=None):
    """ Helper function to calculate completion data for a given activity index. """
    try:
        completion_rate = CompletionRate.objects.get(activity_index=activity_index)
        completions_per_hour = (
            completion_rate.completions_per_hour_iron if is_iron else completion_rate.completions_per_hour_main
        )

        # Calculate drop rates
        droprate_neither = calculate_effective_droprate_neither(activity_index, user_data)
        droprate_independent = calculate_effective_droprate_independent(activity_index, user_data)

        # Retrieve time values
        time_to_exact = safe_float_conversion(calculate_time_to_exact(activity_index, completions_per_hour, user_data))
        time_to_ei = safe_float_conversion(calculate_time_to_ei(activity_index, completions_per_hour, user_data))
        time_to_next_log_slot = safe_float_conversion(calculate_time_to_next_log_slot(activity_index, completions_per_hour, user_data))

        # Debugging output to track values
        print(f"DEBUG: Activity {activity_index} -> time_to_exact={time_to_exact}, time_to_ei={time_to_ei}, time_to_next_log_slot={time_to_next_log_slot}")

        # Get the fastest time
        time_values = {
            'exact': time_to_exact,
            'ei': time_to_ei,
            'next_log_slot': time_to_next_log_slot
        }
        fastest_time = min(filter(lambda x: isinstance(x, (int, float)) and x > 0, time_values.values()), default=None)

        # Exclude completed items from ActivityMap
        completed_items = user_data.get('completed_items', [])
        fastest_item_name = None

        if fastest_time:
            fastest_item = ActivityMap.objects.filter(
                completion_rate=completion_rate
            ).exclude(item_id__in=completed_items).order_by('drop_rate_attempts').first()  # ✅ Exclude completed items

            if fastest_item:
                fastest_item_name = fastest_item.item_name  # ✅ Get the actual next uncompleted item

        return {
            'activity_index': activity_index,
            'activity_name': completion_rate.activity_name,
            'fastest_log_slot': fastest_time,  # Time in days
            'fastest_slot_name': fastest_item_name or "Unknown",  # ✅ Now returning the correct next uncompleted item
            'droprate_neither': droprate_neither,
            'droprate_independent': droprate_independent,
            'time_to_exact': time_to_exact,
            'time_to_ei': time_to_ei,
            'time_to_next_log_slot': time_to_next_log_slot,
        }

    except CompletionRate.DoesNotExist:
        return {"error": "Data not available"}


@csrf_exempt
def calculate_all_completion_times(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        is_iron = data.get("is_iron", False)
        completed_items = data.get("completed_items", [])

        user_data = {'completed_items': [int(item) for item in completed_items]}  # Convert to integers

        completion_times = []
        activities = CompletionRate.objects.values_list('activity_index', flat=True).distinct()

        for activity_index in activities:
            completion_data = calculate_completion_data(activity_index, is_iron, user_data)
            if "error" not in completion_data:
                completion_times.append(completion_data)

        return JsonResponse({'status': 'success', 'data': completion_times})

    return JsonResponse({'status': 'error', 'message': 'Invalid method'}, status=405)


def safe_float_conversion(value):
    """ Converts a value to float; returns None if conversion fails. """
    try:
        return float(value)
    except (ValueError, TypeError):
        return None  # Return None to prevent invalid values in calculations


def activity_map_status(request):
    """ Retrieves activity map status, checking if items are completed and active. """
    user_data = request.session.get('user_data', {'completed_items': []})
    completed_items = user_data.get('completed_items', [])

    activity_map_items = []
    activity_maps = ActivityMap.objects.all()

    for item in activity_maps:
        is_completed = item.item_id in completed_items
        requires_previous = item.requires_previous
        previous_item_completed = (item.sequence - 1) in completed_items if item.sequence > 0 else True

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
