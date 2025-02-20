# vitaforge/backend/api/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("health-profile/", views.HealthProfileView.as_view(), name="healthprofile-create-list"),
    path("health-profile/detail/", views.HealthProfileDetail.as_view(), name="healthprofile-detail"),
]
