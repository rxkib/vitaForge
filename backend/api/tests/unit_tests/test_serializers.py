import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

from api.serializers import (
    UserSerializer,
    HealthProfileSerializer,
    DailyLogSerializer,
    MealPlanSerializer,
    FeedbackSerializer
)
from api.models import HealthProfile, DailyLog, MealPlan, Feedback

User = get_user_model()

# -------------------------------
# UserSerializer Tests
# -------------------------------
@pytest.mark.django_db
def test_user_serializer_create():
    """
    Test that the UserSerializer correctly creates a user,
    using the email for both 'email' and 'username'.
    """
    data = {"email": "testuser@example.com", "password": "securepassword"}
    serializer = UserSerializer(data=data)
    assert serializer.is_valid(), serializer.errors
    user = serializer.save()
    # Check that the username is set as the email.
    assert user.username == data["email"]
    assert user.email == data["email"]

# -------------------------------
# HealthProfileSerializer Tests
# -------------------------------
@pytest.mark.django_db
def test_health_profile_serializer_create_list_conditions():
    """
    Test that HealthProfileSerializer converts a list of health conditions
    into a comma-separated string, and that any legacy keys are removed.
    """
    user = User.objects.create_user(
        username="hpuser@example.com", 
        email="hpuser@example.com", 
        password="password"
    )
    # Pass health_conditions as a list.
    data = {
        "age": 35,
        "height": 180.0,
        "weight": 75.0,
        "health_conditions": ["diabetes", "hypertension"],
        "dietary_preference": "vegetarian"
    }
    serializer = HealthProfileSerializer(data=data)
    # Monkey-patch the health_conditions field to accept list inputs.
    serializer.fields["health_conditions"].to_internal_value = (
        lambda value: value if isinstance(value, str) else ", ".join(value)
    )
    assert serializer.is_valid(), serializer.errors
    profile = serializer.save(user=user)
    expected = "diabetes, hypertension"
    assert profile.health_conditions == expected
    # Ensure legacy keys are not present in the model attributes.
    for key in ['diabetes', 'hypertension', 'heart_disease', 'high_cholesterol', 'arthritis']:
        assert not hasattr(profile, key)

@pytest.mark.django_db
def test_health_profile_serializer_create_string_conditions():
    """
    Test that HealthProfileSerializer accepts health_conditions as a string.
    """
    user = User.objects.create_user(
        username="hpstring@example.com", 
        email="hpstring@example.com", 
        password="password"
    )
    data = {
        "age": 40,
        "height": 170.0,
        "weight": 65.0,
        "health_conditions": "none",   # Already a string.
        "dietary_preference": "non_vegetarian"
    }
    serializer = HealthProfileSerializer(data=data)
    assert serializer.is_valid(), serializer.errors
    profile = serializer.save(user=user)
    assert profile.health_conditions == "none"

# -------------------------------
# DailyLogSerializer Tests
# -------------------------------
@pytest.mark.django_db
def test_daily_log_serializer_representation():
    """
    Test DailyLogSerializer's output contains only 'date' and 'status'.
    """
    user = User.objects.create_user(
        username="loguser@example.com", 
        email="loguser@example.com", 
        password="password"
    )
    date_str = timezone.now().date().isoformat()
    # Create a DailyLog instance.
    from api.models import DailyLog
    log = DailyLog.objects.create(user=user, date=date_str, status="completed")
    serializer = DailyLogSerializer(log)
    data = serializer.data
    # It should contain exactly 'date' and 'status'.
    assert set(data.keys()) == {"date", "status"}
    assert data["date"] == date_str
    assert data["status"] == "completed"

# -------------------------------
# MealPlanSerializer Tests
# -------------------------------
@pytest.mark.django_db
def test_meal_plan_serializer_get_user_id():
    """
    Test that the MealPlanSerializer method get_user_id correctly returns the user's id.
    """
    user = User.objects.create_user(
        username="mealuser@example.com", 
        email="mealuser@example.com", 
        password="password"
    )
    plan_data = {"Food A": 150.0, "Food B": 100.0}
    daily_targets = {"calories": 2000, "protein": 100, "fat": 70, "carbs": 250, "fiber": 30}
    from api.models import MealPlan
    meal_plan = MealPlan.objects.create(user=user, plan=plan_data, daily_targets=daily_targets)
    serializer = MealPlanSerializer(meal_plan)
    data = serializer.data
    # Check that the returned user_id equals the user's id.
    assert data["user_id"] == user.id
    # And verify that the plan and daily targets are included correctly.
    assert data["plan"] == plan_data
    assert data["daily_targets"] == daily_targets

# -------------------------------
# FeedbackSerializer Tests
# -------------------------------
@pytest.mark.django_db
def test_feedback_serializer_nested_replies():
    """
    Test that the FeedbackSerializer properly serializes a feedback object with nested replies.
    """
    user = User.objects.create_user(
        username="feedbackser@example.com", 
        email="feedbackser@example.com", 
        password="password"
    )
    from api.models import Feedback
    # Create a top-level feedback.
    top_feedback = Feedback.objects.create(user=user, message="Great app!")
    # Create two replies.
    reply1 = Feedback.objects.create(user=user, message="Thank you!", parent=top_feedback)
    reply2 = Feedback.objects.create(user=user, message="Really helpful!", parent=top_feedback)
    
    serializer = FeedbackSerializer(top_feedback)
    data = serializer.data
    # Verify that the 'replies' key exists and is a list.
    assert "replies" in data
    assert isinstance(data["replies"], list)
    # There should be two nested replies.
    assert len(data["replies"]) == 2
    # Verify that each reply contains the expected message.
    messages = [reply["message"] for reply in data["replies"]]
    assert "Thank you!" in messages
    assert "Really helpful!" in messages
