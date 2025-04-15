import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
def test_log_a_meal_get_recap_happy_path():
    """
    Happy Path:
    1. Log a meal by posting to /daily-log/ with valid date and status.
    2. Retrieve a recap for that date from /daily-log/<date_str>/recap/,
       verifying that the weight and BMI (computed from the health profile) are correct.
    """
    client = APIClient()
    
    # Create and authenticate a test user.
    user = User.objects.create_user(username="mealrecap@example.com", email="mealrecap@example.com", password="password")
    client.force_authenticate(user=user)
    
    # Create a HealthProfile for this user with a specific weight_history entry.
    from api.models import HealthProfile
    test_date = "2025-01-15"
    profile_data = {
        "age": 30,
        "height": 170.0,  # centimeters
        "weight": 70.0,   # current weight, also included in history
        "health_conditions": "none",
        "dietary_preference": "non_vegetarian",
        "weight_history": [
            {"date": test_date, "weight": 70.0}
        ]
    }
    HealthProfile.objects.create(user=user, **profile_data)
    
    # Step 1: Log a Meal.
    daily_log_url = reverse("daily-log")
    log_data = {
        "date": test_date,
        "status": "completed"
    }
    response = client.post(daily_log_url, data=log_data, format="json")
    assert response.status_code == 200, f"Daily log POST failed: {response.content}"
    
    log_response = response.json()
    assert "message" in log_response, "Response missing confirmation message"
    assert "log" in log_response, "Response missing log details"
    assert log_response["log"]["date"] == test_date, "Logged date mismatch"
    assert log_response["log"]["status"] == "completed", "Logged status mismatch"
    
    # Step 2: Retrieve Recap.
    recap_url = reverse("daily-log-recap", kwargs={"date_str": test_date})
    response = client.get(recap_url)
    assert response.status_code == 200, f"Daily log recap GET failed: {response.content}"
    recap_data = response.json()
    
    # Expected BMI: BMI = weight / ((height/100)^2)
    # For height=170 cm and weight=70 kg: BMI ≈ 70 / (1.7^2) ≈ 24.2 (rounded to one decimal).
    expected_bmi = round(70 / (1.7**2), 1)
    assert recap_data["date"] == test_date, "Recap date mismatch"
    assert recap_data["status"] == "completed", "Recap status mismatch"
    assert recap_data["weight"] == 70.0, "Recap weight mismatch"
    assert recap_data["bmi"] == expected_bmi, f"Expected BMI {expected_bmi}, got {recap_data['bmi']}"

# -------------------------------
# Error Case 1: GET recap for non-existent log.
# -------------------------------
@pytest.mark.django_db
def test_get_recap_no_daily_log():
    """
    Test GET /daily-log/<date_str>/recap/ for a date with no daily log.
    Expect a 404 error with an appropriate error message.
    """
    client = APIClient()
    
    # Create and authenticate a test user.
    user = User.objects.create_user(username="nolog@example.com", email="nolog@example.com", password="password")
    client.force_authenticate(user=user)
    
    # Create a HealthProfile with a weight entry for a different date.
    from api.models import HealthProfile
    HealthProfile.objects.create(
        user=user,
        age=30,
        height=170.0,
        weight=70.0,
        health_conditions="none",
        dietary_preference="non_vegetarian",
        weight_history=[{"date": "2025-01-10", "weight": 70.0}]
    )
    
    # Request a recap for a date that does not have a daily log.
    missing_date = "2025-01-15"
    recap_url = reverse("daily-log-recap", kwargs={"date_str": missing_date})
    response = client.get(recap_url)
    # Expect a 404 error.
    assert response.status_code == 404, f"Expected 404 for missing log, got {response.status_code}"
    error_data = response.json()
    assert "error" in error_data, "Expected error key in response for missing log"
    assert error_data["error"] == "No log found for that date.", "Unexpected error message for missing log"

# -------------------------------
# Error Case 2: POST with missing fields or invalid status.
# -------------------------------
@pytest.mark.django_db
def test_post_daily_log_invalid_data():
    """
    Test that posting a daily log with missing 'date' or an invalid 'status'
    returns a 400 error with an appropriate error message.
    """
    client = APIClient()
    
    # Create and authenticate a test user.
    user = User.objects.create_user(username="invalidlog@example.com", email="invalidlog@example.com", password="password")
    client.force_authenticate(user=user)
    
    daily_log_url = reverse("daily-log")
    
    # Case 1: Missing 'date'
    data_missing_date = {"status": "completed"}
    response = client.post(daily_log_url, data=data_missing_date, format="json")
    assert response.status_code == 400, f"Expected 400 for missing date, got {response.status_code}"
    error_data = response.json()
    assert "error" in error_data, "Expected error key for missing date"
    assert error_data["error"] == "Invalid data", "Unexpected error message for missing date"
    
    # Case 2: Invalid 'status' value.
    data_invalid_status = {"date": "2025-01-15", "status": "invalid_status"}
    response = client.post(daily_log_url, data=data_invalid_status, format="json")
    assert response.status_code == 400, f"Expected 400 for invalid status, got {response.status_code}"
    error_data = response.json()
    assert "error" in error_data, "Expected error key for invalid status"
    assert error_data["error"] == "Invalid data", "Unexpected error message for invalid status"

# -------------------------------
# Error Case 3: GET recap when no HealthProfile exists.
# -------------------------------
@pytest.mark.django_db
def test_get_recap_no_health_profile():
    """
    Test GET /daily-log/<date_str>/recap/ when the user has no HealthProfile.
    Expect a 404 error stating no health profile is found.
    """
    client = APIClient()
    
    # Create and authenticate a test user without a health profile.
    user = User.objects.create_user(username="nohp@example.com", email="nohp@example.com", password="password")
    client.force_authenticate(user=user)
    
    # First, create a daily log so that the view gets past that check.
    daily_log_url = reverse("daily-log")
    log_data = {"date": "2025-01-20", "status": "completed"}
    client.post(daily_log_url, data=log_data, format="json")
    
    # Now request the recap for that date.
    recap_url = reverse("daily-log-recap", kwargs={"date_str": "2025-01-20"})
    response = client.get(recap_url)
    assert response.status_code == 404, f"Expected 404 when health profile is missing, got {response.status_code}"
    error_data = response.json()
    assert "error" in error_data, "Expected error key when health profile missing"
    expected_error = "No health profile found for the user."
    assert error_data["error"] == expected_error, f"Unexpected error message: {error_data['error']}"
