from django.urls import path
from . import views

urlpatterns = [
    path('upload_json/', views.upload_json, name='upload_json'),
    path('fetch-user/', views.fetch_user_data, name='fetch_user_data'),
    path('get-collection-log/', views.get_collection_log, name='get_collection_log'),
    path('calculate-completion-times/', views.calculate_all_completion_times, name='calculate_completion_times'),
    path('activity-map-status/', views.activity_map_status, name='activity_map_status'),
]
