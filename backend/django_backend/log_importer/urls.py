from django.urls import path
from . import views

urlpatterns = [
    path('collection-log/', views.handle_collection_log, name='collection_log'),
    path('get-collection-log/', views.get_collection_log, name='get_collection_log'),
    path('get-activities-data/', views.get_activities_data, name='get_activities_data'),
]
