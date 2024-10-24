from django.urls import path
from .views import upload_json

urlpatterns = [
    path('upload/', upload_json, name='upload_json'),
]
