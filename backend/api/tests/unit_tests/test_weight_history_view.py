import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

# Import your HealthProfile model
from api.models import HealthProfile

User = get_user_model()

@pytest.mark.django_db
def test_weight_history_get():
    """
    Test GET for the WeightHistoryView endpoint.
    It should return the last 7 entries from the weight history.
    """
    client = APIClient()

    # Create a test user.
    user = User.objects.create_user(
        username="weightget@example.com",
        email="weightget@example.com",
        password="password"
    )

    # Create a HealthProfile with more than 7 weight entries.
    profile = HealthProfile.objects.create(
        user=user,
        age=25,
        height=170.0,
        weight=70.0,
        health_conditions="",
        dietary_preference="non_vegetarian",
        weight_history=[
            {"date": "2025-01-01", "weight": 70.0},
            {"date": "2025-01-02", "weight": 70.5},
            {"date": "2025-01-03", "weight": 71.0},
            {"date": "2025-01-04", "weight": 71.5},
            {"date": "2025-01-05", "weight": 72.0},
            {"date": "2025-01-06", "weight": 72.5},
            {"date": "2025-01-07", "weight": 73.0},
            {"date": "2025-01-08", "weight": 73.5},
        ]
    )

    # Authenticate the user.
    client.force_authenticate(user=user)

    # Use the URL name as set in your urls.py ("weight_history").
    url = reverse("weight_history")
    response = client.get(url)

    assert response.status_code == 200
    data = response.json()

    # The expected slice is the last 7 entries.
    expected_history = profile.weight_history[-7:]
    assert data == expected_history

@pytest.mark.django_db
def test_weight_history_post_success():
    """
    Test POST for the WeightHistoryView endpoint when a valid weight is provided.
    A new entry is appended and the profile's weight is updated.
    """
    client = APIClient()

    # Create a test user.
    user = User.objects.create_user(
        username="weightpost@example.com",
        email="weightpost@example.com",
        password="password"
    )

    # Create a HealthProfile with an initial weight history.
    profile = HealthProfile.objects.create(
        user=user,
        age=25,
        height=170.0,
        weight=70.0,
        health_conditions="",
        dietary_preference="non_vegetarian",
        weight_history=[
            {"date": "2025-01-01", "weight": 70.0},
            {"date": "2025-01-02", "weight": 70.5},
        ]
    )

    # Authenticate the user.
    client.force_authenticate(user=user)

    url = reverse("weight_history")
    new_weight = 71.5
    response = client.post(url, data={"weight": new_weight})

    # Expect a 200 OK.
    assert response.status_code == 200

    # Refresh the profile from the DB to get updated values.
    profile.refresh_from_db()

    # Get the returned weight history from the response.
    data = response.json()

    # The response should return the last 7 entries; since we have only a few entries, it will be the entire list.
    expected_history = profile.weight_history[-7:]
    assert data == expected_history

    # Also verify that the profile's weight is updated.
    assert profile.weight == new_weight

@pytest.mark.django_db
def test_weight_history_post_missing_weight():
    """
    Test POST for WeightHistoryView when no weight is provided in the request.
    It should return a 400 error with an appropriate error message.
    """
    client = APIClient()

    user = User.objects.create_user(
        username="nomissing@example.com",
        email="nomissing@example.com",
        password="password"
    )

    # Create a HealthProfile for the user.
    HealthProfile.objects.create(
        user=user,
        age=25,
        height=170.0,
        weight=70.0,
        health_conditions="",
        dietary_preference="non_vegetarian",
        weight_history=[]
    )

    client.force_authenticate(user=user)
    url = reverse("weight_history")

    # POST with no weight value.
    response = client.post(url, data={})
    assert response.status_code == 400

    data = response.json()
    assert "error" in data
    assert data["error"] == "Weight is required"
