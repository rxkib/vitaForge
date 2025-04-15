import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
def test_create_retrieve_update_health_profile():
    """
    Functional test for the health profile lifecycle:
    
    1. Create Profile → POST to /health-profile/
    2. Retrieve Profile → GET from /health-profile/detail/
    3. Update Profile → PUT to /health-profile/detail/
    
    This test verifies that:
      - A new health profile is created with the intended data.
      - The created profile can be retrieved and returns the same values.
      - An update (e.g., changing age and weight) is persisted and reflected in the data.
    """
    client = APIClient()
    
    # Create and authenticate a test user.
    user = User.objects.create_user(
        username="profileuser@example.com",
        email="profileuser@example.com",
        password="password"
    )
    client.force_authenticate(user=user)
    
    # --- Step 1: Create Profile ---
    create_url = reverse("healthprofile-create-list")
    profile_data = {
        "age": 30,
        "height": 170.0,
        "weight": 70.0,
        "health_conditions": "none",  # Sent as string (as required by our serializer)
        "dietary_preference": "non_vegetarian"
    }
    response = client.post(create_url, data=profile_data, format="json")
    # Depending on your implementation, expect a 200 or 201 status.
    assert response.status_code in [200, 201], f"Profile creation failed: {response.content}"
    
    created_profile = response.json()
    # Check that basic fields match what was sent.
    assert created_profile["age"] == profile_data["age"]
    assert created_profile["height"] == profile_data["height"]
    assert created_profile["weight"] == profile_data["weight"]
    
    # --- Step 2: Retrieve Profile ---
    detail_url = reverse("healthprofile-detail")
    response = client.get(detail_url)
    assert response.status_code == 200, f"Profile retrieval failed: {response.content}"
    retrieved_profile = response.json()
    # Verify retrieved values.
    assert retrieved_profile["age"] == profile_data["age"]
    assert retrieved_profile["height"] == profile_data["height"]
    assert retrieved_profile["weight"] == profile_data["weight"]
    
    # --- Step 3: Update Profile ---
    update_data = {
        "age": 31,                # Updated age
        "height": 170.0,          # Height remains the same
        "weight": 72.0,           # Updated weight
        "health_conditions": "none",  # Still "none"
        "dietary_preference": "non_vegetarian"
    }
    response = client.put(detail_url, data=update_data, format="json")
    assert response.status_code == 200, f"Profile update failed: {response.content}"
    updated_profile = response.json()
    
    # Verify that updated fields have new values.
    assert updated_profile["age"] == update_data["age"]
    assert updated_profile["weight"] == update_data["weight"]

    # OPTIONAL: You may also add error tests here, such as testing that an unauthenticated request
    # returns a 401 status, or a request with missing required fields returns a 400.
