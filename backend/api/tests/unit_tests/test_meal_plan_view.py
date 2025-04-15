import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from django.utils import timezone

from api.models import HealthProfile, MealPlan, FoodItem
from api.views import MealPlanOptimizationView  # only needed for monkeypatching, if desired

User = get_user_model()

# -----------------------------
# Helpers and Dummy Functions
# -----------------------------

def dummy_generate_meal_plan(food_ids, daily_targets, population_size, generations, min_portion, max_portion, min_foods):
    """
    Dummy generate_meal_plan: returns a fixed plan and the same daily targets.
    """
    # For testing, simply return a plan mapping two foods to fixed portions.
    dummy_plan = {"Food A": 100.0, "Food B": 200.0}
    return dummy_plan, daily_targets

# For compute_daily_macro_targets, if needed, you can assume it returns the passed targets unchanged.
def dummy_compute_daily_macro_targets(age, height, weight, goal):
    # For testing, return a dummy daily target dictionary.
    return {"calories": 2000, "protein": 150, "fat": 70, "carbs": 250, "fiber": 30}

# -----------------------------
# Tests for MealPlanOptimizationView
# -----------------------------

@pytest.mark.django_db
def test_meal_plan_optimization_success(monkeypatch):
    """
    Test POST for MealPlanOptimizationView when a HealthProfile exists.
    We monkey-patch generate_meal_plan and compute_daily_macro_targets to return
    fixed values, so that the response is deterministic.
    """
    client = APIClient()
    
    # Create a test user and a corresponding HealthProfile.
    user = User.objects.create_user(username="optimizer@example.com", email="optimizer@example.com", password="password")
    client.force_authenticate(user=user)
    
    # Create a HealthProfile for the user.
    profile = HealthProfile.objects.create(
        user=user,
        age=30,
        height=170,
        weight=70,
        health_conditions="",
        dietary_preference="non_vegetarian",
        weight_history=[{"date": timezone.now().strftime("%Y-%m-%d"), "weight": 70}]
    )
    
    # Monkey-patch the functions used in the view.
    monkeypatch.setattr('api.views.generate_meal_plan', dummy_generate_meal_plan)
    monkeypatch.setattr('api.views.compute_daily_macro_targets', dummy_compute_daily_macro_targets)
    
    url = reverse("meal_plan_optimization")
    post_data = {
        "goal": "maintain",
        # Optionally, we could pass a list of food_ids, but for our dummy function it doesn't matter.
        "food_ids": [1, 2, 3]
    }
    response = client.post(url, data=post_data, format="json")
    
    # Expect status 200 OK.
    assert response.status_code == 200
    data = response.json()
    # The dummy_generate_meal_plan returns dummy plan and daily targets.
    expected_targets = dummy_compute_daily_macro_targets(profile.age, profile.height, profile.weight, post_data["goal"])
    expected_plan = {"Food A": 100.0, "Food B": 200.0}
    
    assert data["daily_targets"] == expected_targets
    assert data["meal_plan"] == expected_plan

@pytest.mark.django_db
def test_meal_plan_optimization_error():
    """
    Test POST for MealPlanOptimizationView when the user's HealthProfile does not exist.
    In this case, get_object_or_404 fails and the view catches the error returning a 400.
    """
    client = APIClient()
    user = User.objects.create_user(username="nohp@example.com", email="nohp@example.com", password="password")
    client.force_authenticate(user=user)
    
    url = reverse("meal_plan_optimization")
    post_data = {"goal": "maintain", "food_ids": [1, 2]}
    response = client.post(url, data=post_data, format="json")
    
    # Expect a 400 error since no HealthProfile exists.
    assert response.status_code == 400
    data = response.json()
    assert "error" in data


# -----------------------------
# Tests for SavedMealPlanView
# -----------------------------

@pytest.mark.django_db
def test_saved_meal_plan_get_success():
    """
    Test GET for SavedMealPlanView when a meal plan exists.
    """
    client = APIClient()
    user = User.objects.create_user(username="savedget@example.com", email="savedget@example.com", password="password")
    client.force_authenticate(user=user)
    
    # Create a MealPlan for the user.
    meal_plan_obj = MealPlan.objects.create(
        user=user,
        plan={"Food A": 120.0, "Food B": 180.0},
        daily_targets={"calories": 2000, "protein": 100, "fat": 70, "carbs": 250, "fiber": 30}
    )
    
    url = reverse("saved_meal_plan")
    response = client.get(url)
    assert response.status_code == 200
    data = response.json()
    
    # Check that the response contains the fields from the MealPlan.
    assert data["id"] == meal_plan_obj.id
    assert data["plan"] == meal_plan_obj.plan
    assert data["daily_targets"] == meal_plan_obj.daily_targets
    # user_id should be equal to user's id.
    assert data["user_id"] == user.id

@pytest.mark.django_db
def test_saved_meal_plan_get_failure():
    """
    Test GET for SavedMealPlanView when no meal plan exists.
    """
    client = APIClient()
    user = User.objects.create_user(username="savedgetfail@example.com", email="savedgetfail@example.com", password="password")
    client.force_authenticate(user=user)
    
    url = reverse("saved_meal_plan")
    response = client.get(url)
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "No saved meal plan."

@pytest.mark.django_db
def test_saved_meal_plan_post_create():
    """
    Test POST for SavedMealPlanView when no meal plan exists (creation).
    """
    client = APIClient()
    user = User.objects.create_user(username="savedpostcreate@example.com", email="savedpostcreate@example.com", password="password")
    client.force_authenticate(user=user)
    
    url = reverse("saved_meal_plan")
    post_data = {
        "plan": {"Food A": 150.0},
        "daily_targets": {"calories": 2100, "protein": 110, "fat": 80, "carbs": 260, "fiber": 35}
    }
    response = client.post(url, data=post_data, format="json")
    assert response.status_code == 200
    data = response.json()
    
    # Verify that the created meal plan data matches the post_data.
    assert data["plan"] == post_data["plan"]
    assert data["daily_targets"] == post_data["daily_targets"]
    # Verify in the database.
    from api.models import MealPlan
    assert MealPlan.objects.filter(user=user).exists()

@pytest.mark.django_db
def test_saved_meal_plan_post_update():
    """
    Test POST for SavedMealPlanView when a meal plan exists (update).
    """
    client = APIClient()
    user = User.objects.create_user(username="savedpostupdate@example.com", email="savedpostupdate@example.com", password="password")
    client.force_authenticate(user=user)
    
    # Create an initial meal plan.
    from api.models import MealPlan
    meal_plan_obj = MealPlan.objects.create(
        user=user,
        plan={"Food A": 150.0},
        daily_targets={"calories": 2100, "protein": 110, "fat": 80, "carbs": 260, "fiber": 35}
    )
    
    url = reverse("saved_meal_plan")
    update_data = {
        "plan": {"Food A": 160.0, "Food B": 200.0},
        "daily_targets": {"calories": 2200, "protein": 120, "fat": 90, "carbs": 270, "fiber": 40}
    }
    response = client.post(url, data=update_data, format="json")
    assert response.status_code == 200
    data = response.json()
    
    # Verify that the meal plan has been updated.
    meal_plan_obj.refresh_from_db()
    assert meal_plan_obj.plan == update_data["plan"]
    assert meal_plan_obj.daily_targets == update_data["daily_targets"]

@pytest.mark.django_db
def test_saved_meal_plan_delete_success():
    """
    Test DELETE for SavedMealPlanView when a meal plan exists.
    """
    client = APIClient()
    user = User.objects.create_user(username="saveddelete@example.com", email="saveddelete@example.com", password="password")
    client.force_authenticate(user=user)
    
    # Create a MealPlan for the user.
    from api.models import MealPlan
    meal_plan_obj = MealPlan.objects.create(
        user=user,
        plan={"Food A": 150.0},
        daily_targets={"calories": 2100, "protein": 110, "fat": 80, "carbs": 260, "fiber": 35}
    )
    
    url = reverse("saved_meal_plan")
    response = client.delete(url)
    assert response.status_code == 200
    data = response.json()
    assert data["detail"] == "Saved meal plan deleted."
    
    # Verify that the meal plan is deleted.
    assert not MealPlan.objects.filter(user=user).exists()

@pytest.mark.django_db
def test_saved_meal_plan_delete_failure():
    """
    Test DELETE for SavedMealPlanView when no meal plan exists.
    """
    client = APIClient()
    user = User.objects.create_user(username="saveddeletfail@example.com", email="saveddeletfail@example.com", password="password")
    client.force_authenticate(user=user)
    
    url = reverse("saved_meal_plan")
    response = client.delete(url)
    # Expect a 404 error.
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "No saved meal plan found."
