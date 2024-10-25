from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import Tab, LogEntry, Item, KillCount
import json

@csrf_exempt
def upload_json(request):
    if request.method == 'POST':
        try:
            # Access the uploaded file
            json_file = request.FILES['file']
            data = json.load(json_file)

            # No need to save to the database; just return the data for frontend to store
            tabs_data = data.get('tabs', {})
            processed_data = []

            for tab_name, entries in tabs_data.items():
                for entry_name, entry_data in entries.items():
                    # Collect items from each log entry
                    for item_data in entry_data.get('items', []):
                        processed_data.append({
                            'id': item_data['id'],
                            'name': item_data['name'],
                            'obtained': item_data['obtained']
                        })

                    # Collect kill counts from each log entry
                    for kill_data in entry_data.get('killCounts', []):
                        processed_data.append({
                            'name': kill_data['name'],
                            'amount': kill_data['amount']
                        })

            # Return the processed data back to the frontend
            return JsonResponse({'status': 'success', 'data': processed_data})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    return JsonResponse({'status': 'error', 'message': 'Invalid method'}, status=405)


def get_collection_log(request):
    # The request is now used to fetch data for a user, typically based on localStorage in the frontend
    items = Item.objects.all()

    # Prepare the data for each item in the collection log
    data = [
        {
            'id': item.id,
            'name': item.name,
            'obtained': item.obtained,  # Collected or not
        }
        for item in items
    ]

    return JsonResponse({'status': 'success', 'data': data})
