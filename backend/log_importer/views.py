import requests 
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from .models import Item, CompletionRate, ActivityMap

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

def get_completion_rates(request):
    """Fetches default completion rates including extra metadata"""
    try:
        completion_rates = list(CompletionRate.objects.values(
            "activity_name", 
            "completions_per_hour_main", 
            "completions_per_hour_iron",
            "extra_time_to_first_completion",
            "notes",
            "verification_source"
        ))
        return JsonResponse({"status": "success", "data": completion_rates})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
def get_activities_data(request):
    """
    Returns raw data for each activity. 
    The frontend will perform calculations.
    """
    if request.method == 'GET':
        activities = CompletionRate.objects.all()
        data = []

        for activity in activities:
            maps_qs = ActivityMap.objects.filter(completion_rate=activity)
            maps_data = [
                {
                    "item_id": m.item_id,
                    "item_name": m.item_name,
                    "drop_rate_attempts": m.drop_rate_attempts,
                    "neither_inverse": m.neither_inverse,
                }
                for m in maps_qs
            ]

            data.append({
                "activity_index": activity.activity_index,
                "activity_name": activity.activity_name,
                "completions_per_hour_main": activity.completions_per_hour_main,
                "completions_per_hour_iron": activity.completions_per_hour_iron,
                "maps": maps_data
            })

        return JsonResponse({"status": "success", "data": data}, safe=False)
    
    return JsonResponse({"status": "error", "message": "Invalid method"}, status=405)
