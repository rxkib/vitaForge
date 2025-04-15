import pytest
from django.urls import reverse
from rest_framework.test import APIClient

@pytest.mark.django_db
def test_user_registration_missing_fields():
    """
    Test registration endpoint when required fields are missing.
    Expects a 400 error with appropriate error messages.
    """
    client = APIClient()
    register_url = reverse("register")
    
    # Case 1: Missing email.
    data_missing_email = {"password": "TestPassword123"}
    response = client.post(register_url, data=data_missing_email, format="json")
    assert response.status_code == 400, f"Expected 400 for missing email, got {response.status_code}"
    errors = response.json()
    assert "email" in errors, "Expected error message for missing email"
    
    # Case 2: Missing password.
    data_missing_password = {"email": "invalid@example.com"}
    response = client.post(register_url, data=data_missing_password, format="json")
    assert response.status_code == 400, f"Expected 400 for missing password, got {response.status_code}"
    errors = response.json()
    assert "password" in errors, "Expected error message for missing password"

@pytest.mark.django_db
def test_user_registration_invalid_email():
    """
    Test registration endpoint with an invalid email format.
    Expects a 400 error and an error message for the email field.
    """
    client = APIClient()
    register_url = reverse("register")
    data_invalid_email = {"email": "not-an-email", "password": "TestPassword123"}
    response = client.post(register_url, data=data_invalid_email, format="json")
    assert response.status_code == 400, f"Expected 400 for invalid email format, got {response.status_code}"
    errors = response.json()
    assert "email" in errors, "Expected error message for invalid email format"

@pytest.mark.django_db
def test_health_profile_creation_missing_fields():
    """
    Test health profile creation with missing required fields.
    Expects a 400 error with appropriate error messages.
    """
    client = APIClient()
    # First, create and authenticate a test user.
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = User.objects.create_user(username="profileval@example.com", email="profileval@example.com", password="password")
    client.force_authenticate(user=user)
    
    create_url = reverse("healthprofile-create-list")
    # Missing 'age' and 'weight' fields.
    incomplete_profile_data = {
        "height": 170.0,
        "health_conditions": "none",
        "dietary_preference": "non_vegetarian"
    }
    response = client.post(create_url, data=incomplete_profile_data, format="json")
    assert response.status_code == 400, f"Expected 400 for missing required fields, got {response.status_code}"
    errors = response.json()
    # The exact error structure may vary based on your serializer configuration.
    # We expect errors for both 'age' and 'weight'.
    assert "age" in errors, "Expected error message for missing age"
    assert "weight" in errors, "Expected error message for missing weight"

@pytest.mark.django_db
def test_health_profile_creation_invalid_data_format():
    """
    Test health profile creation with invalid data formats (e.g., non-numeric height).
    Expects a 400 error with an appropriate error message.
    """
    client = APIClient()
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = User.objects.create_user(username="profileinv@example.com", email="profileinv@example.com", password="password")
    client.force_authenticate(user=user)
    
    create_url = reverse("healthprofile-create-list")
    # Set height to an invalid format (string instead of float)
    invalid_profile_data = {
        "age": 30,
        "height": "one-seventy",  # invalid format
        "weight": 70.0,
        "health_conditions": "none",
        "dietary_preference": "non_vegetarian"
    }
    response = client.post(create_url, data=invalid_profile_data, format="json")
    assert response.status_code == 400, f"Expected 400 for invalid height format, got {response.status_code}"
    errors = response.json()
    # Expect an error message for 'height'
    assert "height" in errors, "Expected error message for invalid height format"
