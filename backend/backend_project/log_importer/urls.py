from django.urls import path
from .views import upload_json, get_collection_log, fetch_user_data, calculate_completion_rates

urlpatterns = [
    path('upload/', upload_json, name='upload_json'),
    path('collection-log/', get_collection_log, name='get_collection_log'),
    path('fetch-user/', fetch_user_data, name='fetch_user_data'),
    path('calculate-completion-times/', calculate_completion_rates, name='calculate_completion_times'),  # Ensure the correct path here
]
