import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from django.utils.timezone import now

from api.models import HealthProfile
from api.serializers import HealthProfileSerializer

User = get_user_model()

# ---- HealthProfileView Tests (ListCreateAPIView) ----

@pytest.mark.django_db
def test_health_profile_view_get_empty():
    """
    Test GET for HealthProfileView when no health profile exists.
    Expect an empty list.
    """
    client = APIClient()
    user = User.objects.create_user(
        username="hpempty@example.com",
        email="hpempty@example.com",
        password="password"
    )
    client.force_authenticate(user=user)

    url = reverse("healthprofile-create-list")
    response = client.get(url)
    
    assert response.status_code == 200
    # Expect an empty list if no profile is created.
    assert response.json() == []


@pytest.mark.django_db
def test_health_profile_view_post_with_conditions_and_weight_history():
    """
    Test POST for HealthProfileView.
    When creating a profile, weight_history should be initialized with an entry,
    and the health_conditions field should be correctly stored.
    """
    client = APIClient()
    user = User.objects.create_user(
        username="hpcreate@example.com",
        email="hpcreate@example.com",
        password="password"
    )
    client.force_authenticate(user=user)

    url = reverse("healthprofile-create-list")

    # Pass health_conditions as a comma-separated string rather than a list.
    post_data = {
        "age": 28,
        "height": 175.0,
        "weight": 72.5,
        "health_conditions": "diabetes",  # Expect this value to be stored as-is.
        "dietary_preference": "non_vegetarian"
    }
    
    response = client.post(url, data=post_data, format="json")
    # Expect a successful creation (200 or 201).
    assert response.status_code in [200, 201]
    
    # Fetch the created profile from the DB.
    profile = HealthProfile.objects.get(user=user)
    
    # Since the serializer removes extra keys,
    # check that the health_conditions field is stored as expected.
    assert profile.health_conditions == "diabetes"
    
    # Check that weight_history is a list and an entry was appended.
    today_str = now().strftime("%Y-%m-%d")
    assert isinstance(profile.weight_history, list)
    # At least one entry is expected.
    assert len(profile.weight_history) >= 1
    last_entry = profile.weight_history[-1]
    assert last_entry["date"] == today_str
    assert float(last_entry["weight"]) == float(post_data["weight"])
    
    # Optionally, check response content against the serializer.
    serializer = HealthProfileSerializer(profile)
    response_data = response.json()
    assert "id" in response_data or "user" in response_data


# ---- HealthProfileDetail Tests (RetrieveUpdateAPIView) ----

@pytest.mark.django_db
def test_health_profile_detail_get():
    """
    Test GET for HealthProfileDetail.
    Create a HealthProfile manually and retrieve it via the endpoint.
    """
    client = APIClient()
    user = User.objects.create_user(
        username="hpdetail@example.com",
        email="hpdetail@example.com",
        password="password"
    )
    profile = HealthProfile.objects.create(
        user=user,
        age=30,
        height=180.0,
        weight=80.0,
        health_conditions="diabetes, hypertension",
        dietary_preference="vegetarian",
        weight_history=[{"date": "2025-01-01", "weight": 80.0}]
    )
    
    client.force_authenticate(user=user)
    url = reverse("healthprofile-detail")
    response = client.get(url)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == profile.id
    assert data["age"] == profile.age
    assert data["height"] == profile.height
    assert data["weight"] == profile.weight


@pytest.mark.django_db
def test_health_profile_detail_update():
    """
    Test PUT for HealthProfileDetail.
    Update fields in the HealthProfile and verify the profile is updated.
    """
    client = APIClient()
    user = User.objects.create_user(
        username="hpupdate@example.com",
        email="hpupdate@example.com",
        password="password"
    )
    profile = HealthProfile.objects.create(
        user=user,
        age=30,
        height=180.0,
        weight=80.0,
        health_conditions="",
        dietary_preference="non_vegetarian",
        weight_history=[{"date": "2025-01-01", "weight": 80.0}]
    )
    
    client.force_authenticate(user=user)
    url = reverse("healthprofile-detail")
    
    update_data = {
        "age": 31,
        "height": 180.0,
        "weight": 82.0,
    }
    response = client.put(url, data=update_data, format="json")
    assert response.status_code == 200
    
    profile.refresh_from_db()
    assert profile.age == 31
    assert profile.weight == 82.0
