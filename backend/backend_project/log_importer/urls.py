from django.urls import path
from .views import upload_json, get_collection_log

urlpatterns = [
    path('upload/', upload_json, name='upload_json'),
    path('collection-log/', get_collection_log, name='get_collection_log'),
]
