import os
import json
import requests
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Item, CompletionRate, ActivityMap

@csrf_exempt
def handle_collection_log(request):
    """
    Fetch a user’s collection log from the new API, then re-group items into
    sections using a local sections.json file (which contains your pre‐categorized bosses, clues, etc.).
    """
    if request.method == 'POST':
        try:
            # Parse the request body to extract the username
            request_data = json.loads(request.body)
            username = request_data.get('username')
            if not username:
                return JsonResponse({'status': 'error', 'message': 'Username is required'})

            # Construct the API URL and parameters to fetch the full collection log
            api_url = "https://templeosrs.com/api/collection-log/player_collection_log.php"
            params = {
                "player": username,
                "categories": "all",
                "includenames": "1",
                "includemissingitems": "1"
            }

            response = requests.get(api_url, params=params, timeout=10)
            if response.status_code != 200:
                return JsonResponse({
                    'status': 'error',
                    'message': f'Failed to fetch data from API. Status code: {response.status_code}'
                }, status=response.status_code)

            api_json = response.json()
            # The new API response puts the data under "data"
            data = api_json.get("data", {})
            account_type = data.get("accountType", "Unknown")

            # Overall stats from the API response
            unique_obtained = data.get("total_collections_finished", 0)
            unique_items = data.get("total_collections_available", 0)
            # The API returns the items grouped by sub-category (e.g., "abyssal_sire")
            items_data = data.get("items", {})

            # Load your pre-generated sections mapping (assumed to be in your static directory)
            sections_path = os.path.join(settings.BASE_DIR, "log_importer", "static", "sections.json")
            try:
                with open(sections_path, "r", encoding="utf-8") as f:
                    sections_mapping = json.load(f)
            except Exception as e:
                return JsonResponse({
                    "status": "error",
                    "message": f"Failed to load sections.json: {str(e)}"
                }, status=500)

            # Build the new structure by grouping sub-categories into your major sections
            final_sections = {}
            for major_section, subcats in sections_mapping.items():
                final_sections[major_section] = {}
                # For each sub-category in this major section...
                for subcat, valid_item_ids in subcats.items():
                    # Retrieve the list of items from the API response (may be empty)
                    subcat_items = items_data.get(subcat, [])
                    # Filter the items by validating that the item's id is one we expect
                    filtered_items = [
                        item for item in subcat_items
                        if str(item.get("id")) in valid_item_ids
                    ]
                    # Create the sub-category entry with a killCount placeholder
                    final_sections[major_section][subcat] = {
                        "items": filtered_items,
                        "killCount": {"name": "Unknown", "amount": 0}
                    }

            # Use the order from sections.json as-is (no extra sorting)
            final_data = {
                "username": username,
                "accountType": account_type,
                "uniqueObtained": unique_obtained,
                "uniqueItems": unique_items,
                "sections": final_sections
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


def items_json_view(request):
    json_path = os.path.join(settings.BASE_DIR, "log_importer", "static", "items.json")
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return JsonResponse(data, safe=True)
    except FileNotFoundError:
        return JsonResponse({"error": "items.json not found"}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON format in items.json"}, status=500)
