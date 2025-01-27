from django.urls import path
from . import views

urlpatterns = [
    path('collection-log/', views.handle_collection_log, name='collection_log'),  # Merged function
    path('get-collection-log/', views.get_collection_log, name='get_collection_log'),
    path('calculate-completion-times/', views.calculate_all_completion_times, name='calculate_completion_times'),
    path('activity-map-status/', views.activity_map_status, name='activity_map_status'),
]
