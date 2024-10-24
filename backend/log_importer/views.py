from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json

@csrf_exempt
def upload_json(request):
    if request.method == 'POST':
        try:
            # Access the uploaded file
            json_file = request.FILES['file']
            data = json.load(json_file)

            # Process the data (save it to your model or use it as needed)
            # Example: return the received data back as JSON response
            return JsonResponse({'status': 'success', 'data': data})
        
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    return JsonResponse({'status': 'error', 'message': 'Invalid method'}, status=405)

