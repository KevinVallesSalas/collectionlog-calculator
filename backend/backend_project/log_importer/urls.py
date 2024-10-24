from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.upload_json, name='upload_json'),
]
