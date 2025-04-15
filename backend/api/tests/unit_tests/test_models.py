import pytest
from django.contrib.auth import get_user_model
from django.db.utils import IntegrityError
from django.utils import timezone

from api.models import HealthProfile, DailyLog, FoodItem, MealPlan, Feedback

User = get_user_model()

# -------------------------------------
# HealthProfile Model Tests
# -------------------------------------
@pytest.mark.django_db
def test_health_profile_default_weight_history():
    """
    Test that when a HealthProfile is created without specifying weight_history,
    it defaults to an empty list and its __str__ returns the expected string.
    """
    user = User.objects.create_user(
        username="profile_test@example.com",
        email="profile_test@example.com",
        password="password"
    )
    profile = HealthProfile.objects.create(
        user=user,
        age=30,
        height=175.0,
        weight=70.0,
        dietary_preference="non_vegetarian"
    )
    # Verify that the default weight_history is an empty list.
    assert profile.weight_history == []
    
    expected_str = f"{user.username}'s Health Profile"
    assert str(profile) == expected_str


# -------------------------------------
# DailyLog Model Tests
# -------------------------------------
@pytest.mark.django_db
def test_daily_log_creation_and_unique_constraint():
    """
    Test that a DailyLog is created correctly and that the unique_together constraint
    on (user, date) raises an error when violated.
    """
    user = User.objects.create_user(
        username="log_test@example.com",
        email="log_test@example.com",
        password="password"
    )
    date_val = timezone.now().date()
    
    log1 = DailyLog.objects.create(user=user, date=date_val, status="completed")
    expected_str = f"{user.username} - {date_val} - completed"
    assert str(log1) == expected_str
    
    # Attempting to create a second DailyLog for the same user and date should raise an error.
    with pytest.raises(IntegrityError):
        DailyLog.objects.create(user=user, date=date_val, status="missed")


# -------------------------------------
# FoodItem Model Tests
# -------------------------------------
@pytest.mark.django_db
def test_food_item_str():
    """
    Test that the FoodItem __str__ method returns the provided name,
    and if no name is provided, returns "Unnamed Food".
    """
    food = FoodItem.objects.create(name="Apple")
    assert str(food) == "Apple"
    
    food2 = FoodItem.objects.create(name=None)
    assert str(food2) == "Unnamed Food"


# -------------------------------------
# MealPlan Model Tests
# -------------------------------------
@pytest.mark.django_db
def test_meal_plan_str():
    """
    Test the MealPlan __str__ method returns a string that includes the user's username.
    """
    user = User.objects.create_user(
        username="meal_test@example.com",
        email="meal_test@example.com",
        password="password"
    )
    plan_data = {"Apple": 150.0, "Banana": 100.0}
    daily_targets = {"calories": 2000, "protein": 100, "fat": 70, "carbs": 250, "fiber": 30}
    meal_plan = MealPlan.objects.create(user=user, plan=plan_data, daily_targets=daily_targets)
    
    result = str(meal_plan)
    assert "Meal Plan for" in result
    assert user.username in result


# -------------------------------------
# Feedback Model Tests
# -------------------------------------
@pytest.mark.django_db
def test_feedback_str_and_thread():
    """
    Test that the Feedback model __str__ method returns a string containing the user's username,
    and that threaded replies are set up using the 'replies' related name.
    """
    user = User.objects.create_user(
        username="feedback_test@example.com",
        email="feedback_test@example.com",
        password="password"
    )
    top_feedback = Feedback.objects.create(user=user, message="Great app!")
    # Check the __str__ method.
    output = str(top_feedback)
    assert user.username in output
    
    # Create a reply to the top-level feedback.
    reply = Feedback.objects.create(user=user, message="Thank you!", parent=top_feedback)
    replies = top_feedback.replies.all()
    assert reply in replies
