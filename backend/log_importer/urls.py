from django.urls import path
from . import views

urlpatterns = [
    path('collection-log/', views.handle_collection_log, name='collection_log'),
    path('get-collection-log/', views.get_collection_log, name='get_collection_log'),
    path('get-activities-data/', views.get_activities_data, name='get_activities_data'),
    path('get-completion-rates/', views.get_completion_rates, name='get-completion-rates'),
    path('items-json/', views.items_json_view, name='items_json_view'),
]
