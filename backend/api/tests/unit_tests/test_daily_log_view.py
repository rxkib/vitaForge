import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from api.models import DailyLog, HealthProfile
from api.serializers import DailyLogSerializer

User = get_user_model()

# -------- DailyLogView Tests --------

@pytest.mark.django_db
def test_daily_log_get():
    """
    Test GET for DailyLogView.
    Create multiple daily logs for a user and verify that the GET endpoint returns them.
    """
    client = APIClient()
    user = User.objects.create_user(
        username="dailyget@example.com",
        email="dailyget@example.com",
        password="password"
    )
    # Create two daily logs for the user.
    DailyLog.objects.create(user=user, date="2025-01-01", status="completed")
    DailyLog.objects.create(user=user, date="2025-01-02", status="missed")
    
    client.force_authenticate(user=user)
    url = reverse("daily-log")  # Ensure the URL name "daily-log" is defined in urls.py.
    response = client.get(url)
    
    assert response.status_code == 200
    logs = DailyLog.objects.filter(user=user)
    serializer = DailyLogSerializer(logs, many=True)
    assert response.json() == serializer.data


@pytest.mark.django_db
def test_daily_log_post_success():
    """
    Test POST for DailyLogView with valid data.
    It should create or update a daily log and return a message with the log data.
    """
    client = APIClient()
    user = User.objects.create_user(
        username="dailypost@example.com",
        email="dailypost@example.com",
        password="password"
    )
    client.force_authenticate(user=user)
    
    url = reverse("daily-log")
    data = {
        "date": "2025-01-03",
        "status": "completed"
    }
    response = client.post(url, data=data)
    
    # Expect success: 200 OK.
    assert response.status_code == 200
    json_data = response.json()
    assert "message" in json_data
    assert json_data["message"] == "Log updated"
    assert "log" in json_data
    
    # Confirm that the log exists in the database.
    assert DailyLog.objects.filter(user=user, date="2025-01-03").exists()
    log = DailyLog.objects.get(user=user, date="2025-01-03")
    assert log.status == "completed"


@pytest.mark.django_db
def test_daily_log_post_error():
    """
    Test POST for DailyLogView when missing required data or with an invalid status.
    It should return a 400 error with an appropriate error message.
    """
    client = APIClient()
    user = User.objects.create_user(
        username="dailyerror@example.com",
        email="dailyerror@example.com",
        password="password"
    )
    client.force_authenticate(user=user)
    url = reverse("daily-log")
    
    # Case 1: Missing 'date'.
    data_missing_date = {"status": "completed"}
    response = client.post(url, data=data_missing_date)
    assert response.status_code == 400
    json_data = response.json()
    assert "error" in json_data
    assert json_data["error"] == "Invalid data"
    
    # Case 2: Invalid status value.
    data_invalid_status = {"date": "2025-01-04", "status": "not_valid"}
    response = client.post(url, data=data_invalid_status)
    assert response.status_code == 400
    json_data = response.json()
    assert "error" in json_data
    assert json_data["error"] == "Invalid data"


# -------- DailyLogRecapView Tests --------

@pytest.mark.django_db
def test_daily_log_recap_get_success():
    """
    Test GET for DailyLogRecapView when a DailyLog and a corresponding HealthProfile exist.
    Verifies that the log status, weight, and computed BMI are returned correctly.
    """
    client = APIClient()
    user = User.objects.create_user(
        username="recap@example.com",
        email="recap@example.com",
        password="password"
    )
    client.force_authenticate(user=user)
    
    # Define a date for the log.
    log_date = "2025-01-05"
    
    # Create a DailyLog for that date.
    DailyLog.objects.create(user=user, date=log_date, status="completed")
    
    # Create a HealthProfile with a weight_history that includes the log_date.
    profile = HealthProfile.objects.create(
        user=user,
        age=30,
        height=170,  # in centimeters
        weight=70,
        health_conditions="",
        dietary_preference="non_vegetarian",
        weight_history=[
            {"date": log_date, "weight": 70},
            {"date": "2025-01-04", "weight": 69.5},
        ]
    )
    
    # Call the recap endpoint.
    url = reverse("daily-log-recap", kwargs={"date_str": log_date})
    response = client.get(url)
    assert response.status_code == 200
    data = response.json()
    
    # Verify the recap details.
    # BMI = weight / ((height/100)**2) = 70 / (1.7^2) ≈ 24.2 (rounded to 1 decimal)
    expected_bmi = round(70 / (1.7 ** 2), 1)
    assert data["date"] == log_date
    assert data["status"] == "completed"
    assert data["weight"] == 70
    assert data["bmi"] == expected_bmi


@pytest.mark.django_db
def test_daily_log_recap_no_log():
    """
    Test GET for DailyLogRecapView when no DailyLog exists for the given date.
    It should return a 404 error with an appropriate error message.
    """
    client = APIClient()
    user = User.objects.create_user(
        username="norecap@example.com",
        email="norecap@example.com",
        password="password"
    )
    client.force_authenticate(user=user)
    
    # Create a HealthProfile for the user.
    HealthProfile.objects.create(
        user=user,
        age=30,
        height=170,
        weight=70,
        health_conditions="",
        dietary_preference="non_vegetarian",
        weight_history=[{"date": "2025-01-05", "weight": 70}]
    )
    
    # Use a date for which no DailyLog exists.
    url = reverse("daily-log-recap", kwargs={"date_str": "2025-01-06"})
    response = client.get(url)
    assert response.status_code == 404
    json_data = response.json()
    assert "error" in json_data
    assert json_data["error"] == "No log found for that date."
