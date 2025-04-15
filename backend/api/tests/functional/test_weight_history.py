import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from api.models import HealthProfile

User = get_user_model()

@pytest.mark.django_db
def test_post_weight_history_success():
    """
    Test POST to /health-profile/weight/ to add a new weight entry.
    Verifies that the new weight is appended to the weight_history.
    """
    client = APIClient()
    
    # Create and authenticate a test user.
    user = User.objects.create_user(
        username="weightuser@example.com",
        email="weightuser@example.com",
        password="password"
    )
    client.force_authenticate(user=user)
    
    # Create a HealthProfile for the user with an initially empty weight_history.
    profile_data = {
        "age": 30,
        "height": 170.0,
        "weight": 70.0,
        "health_conditions": "none",
        "dietary_preference": "non_vegetarian",
        "weight_history": []  # Initially empty.
    }
    HealthProfile.objects.create(user=user, **profile_data)
    
    weight_history_url = reverse("weight_history")
    
    # Post a new weight value.
    new_weight = 72.5
    response = client.post(weight_history_url, data={"weight": new_weight}, format="json")
    assert response.status_code == 200, f"Expected 200 OK but got {response.status_code}: {response.content}"
    
    # Verify that the response returns a weight history list containing the new entry.
    history = response.json()
    assert isinstance(history, list), "Weight history should be a list"
    # Check that one entry in the history has the expected new weight.
    found = any(entry["weight"] == new_weight for entry in history)
    assert found, "New weight entry not found in history"

@pytest.mark.django_db
def test_get_weight_history_last_7_entries():
    """
    Test GET /health-profile/weight/ returns only the last 7 entries from weight_history.
    In this test, we create 10 weight history entries in chronological order (oldest first, newest last).
    Thus, for a starting weight of 70.0 and increment of 1 for each entry,
    the most recent 7 entries should have weights: 73.0, 74.0, 75.0, 76.0, 77.0, 78.0, 79.0.
    """
    client = APIClient()

    # Create and authenticate a test user.
    user = User.objects.create_user(
        username="sevenhistory@example.com",
        email="sevenhistory@example.com",
        password="password"
    )
    client.force_authenticate(user=user)

    from datetime import timedelta
    from django.utils import timezone
    base_date = timezone.now().date()
    # Create 10 entries in chronological order: oldest first.
    # For example, let the oldest entry (index 0) be 9 days ago, and the newest (index 9) be today.
    history_entries = []
    # Loop from 0 to 9, where i=0 corresponds to 9 days ago.
    for i in range(10):
        # Calculate date: oldest entry = base_date - 9 days, newest = base_date (i=9)
        entry_date = (base_date - timedelta(days=9 - i)).isoformat()
        # Starting weight: 70.0, increment of 1 for each subsequent day.
        history_entries.append({"date": entry_date, "weight": 70.0 + i})

    HealthProfile.objects.create(
        user=user,
        age=30,
        height=170.0,
        weight=79.0,  # Most recent weight.
        health_conditions="none",
        dietary_preference="non_vegetarian",
        weight_history=history_entries
    )

    weight_history_url = reverse("weight_history")
    response = client.get(weight_history_url)
    assert response.status_code == 200, f"GET weight history failed: {response.content}"
    retrieved_history = response.json()
    # With 10 entries, the last 7 (most recent) should be returned.
    assert len(retrieved_history) == 7, f"Expected 7 entries, got {len(retrieved_history)}"
    
    # Expected weights for the most recent 7 entries: indices 3 to 9.
    expected_weights = [70.0 + i for i in range(3, 10)]  # [73.0, 74.0, 75.0, 76.0, 77.0, 78.0, 79.0]
    # Retrieve the weight values from the response.
    returned_weights = [entry["weight"] for entry in retrieved_history]
    assert returned_weights == expected_weights, f"Expected weights {expected_weights}, got {returned_weights}"

@pytest.mark.django_db
def test_post_weight_history_missing_weight_field():
    """
    Test POST to /health-profile/weight/ without the 'weight' field.
    Expects a 400 error with an appropriate error message.
    """
    client = APIClient()
    
    # Create and authenticate a test user.
    user = User.objects.create_user(
        username="missingweight@example.com",
        email="missingweight@example.com",
        password="password"
    )
    client.force_authenticate(user=user)
    
    # Create a HealthProfile for the user.
    profile_data = {
        "age": 30,
        "height": 170.0,
        "weight": 70.0,
        "health_conditions": "none",
        "dietary_preference": "non_vegetarian",
        "weight_history": []
    }
    HealthProfile.objects.create(user=user, **profile_data)
    
    weight_history_url = reverse("weight_history")
    
    # Post without providing the 'weight' field.
    response = client.post(weight_history_url, data={}, format="json")
    # Expect a 400 Bad Request response.
    assert response.status_code == 400, f"Expected 400 for missing weight, got {response.status_code}"
    error_data = response.json()
    # Check that an error message indicates that weight is required.
    assert "error" in error_data, "Expected error key in response"
    assert error_data["error"] == "Weight is required", f"Unexpected error message: {error_data['error']}"
