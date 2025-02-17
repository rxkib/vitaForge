# vitaforge/backend/api/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("profile/", views.HealthProfileView.as_view(), name="profile-list-create"),
    path("profile/detail/", views.HealthProfileDetail.as_view(), name="profile-detail"),
]
