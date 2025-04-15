import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from api.models import HealthProfile, FoodItem

User = get_user_model()

@pytest.mark.django_db
def test_meal_plan_generation_happy_path():
    """
    Functional test for the meal plan generation flow (happy path):
    1. Create an authenticated user with a HealthProfile.
    2. Create two FoodItem objects with valid nutrient data.
    3. POST to /meal-plan-optimization/ with a valid food_ids list and a goal.
    4. Verify the response returns a meal plan mapping food names to numeric portions and returns daily targets.
    """
    client = APIClient()
    
    # Create and authenticate a test user.
    user = User.objects.create_user(
        username="mealgen@example.com",
        email="mealgen@example.com",
        password="password"
    )
    client.force_authenticate(user=user)
    
    # Create a HealthProfile for the user.
    test_profile_data = {
        "age": 30,
        "height": 170.0,
        "weight": 70.0,
        "health_conditions": "none",
        "dietary_preference": "non_vegetarian",
        "weight_history": [{"date": "2025-01-15", "weight": 70.0}]
    }
    HealthProfile.objects.create(user=user, **test_profile_data)
    
    # Clear any existing FoodItems and create two FoodItem objects.
    FoodItem.objects.all().delete()
    food1 = FoodItem.objects.create(
        name="FoodA",
        tags="fruit",  # This will be used to compute recommended max (e.g., 225)
        protein_g=10.0,
        total_fat_g=5.0,
        carbs_g=20.0,
        total_available_cho_g=None,
        energy_kj=500.0,
        dietary_fibre_g=2.0
    )
    food2 = FoodItem.objects.create(
        name="FoodB",
        tags="pasta",  # Likely no keyword match → default recommended max (15)
        protein_g=8.0,
        total_fat_g=4.0,
        carbs_g=25.0,
        total_available_cho_g=None,
        energy_kj=450.0,
        dietary_fibre_g=1.5
    )
    
    optimization_url = reverse("meal_plan_optimization")
    payload = {
        "goal": "maintain",
        "food_ids": [food1.id, food2.id]
    }
    response = client.post(optimization_url, data=payload, format="json")
    
    # Expect a 200 OK response.
    assert response.status_code == 200, f"Meal plan generation failed: {response.content}"
    data = response.json()
    
    # Check that the response includes the expected keys.
    assert "daily_targets" in data, "Missing daily_targets in response"
    assert "meal_plan" in data, "Missing meal_plan in response"
    
    # Verify that daily targets are a dict and include all keys.
    targets = data["daily_targets"]
    for key in ["calories", "protein", "fat", "carbs", "fiber"]:
        assert key in targets, f"Missing target for {key}"
    
    # The meal_plan should be a dictionary mapping food names to numeric portions.
    plan = data["meal_plan"]
    expected_food_names = {food1.name, food2.name}
    assert set(plan.keys()) == expected_food_names, "Meal plan keys do not match FoodItem names"
    for portion in plan.values():
        assert isinstance(portion, (int, float)), "Portion value is not numeric"

# --------------------------------------
# Edge Case: No Food Items Available
# --------------------------------------
@pytest.mark.django_db
def test_meal_plan_generation_no_food_items():
    """
    Test the meal plan generation flow when no FoodItem objects exist.
    In this edge case, we assume the system returns a 200 response with an empty meal plan.
    """
    client = APIClient()
    
    # Create and authenticate a test user.
    user = User.objects.create_user(
        username="nofood@example.com",
        email="nofood@example.com",
        password="password"
    )
    client.force_authenticate(user=user)
    
    # Create a HealthProfile for the user.
    test_profile_data = {
        "age": 30,
        "height": 170.0,
        "weight": 70.0,
        "health_conditions": "none",
        "dietary_preference": "non_vegetarian",
        "weight_history": [{"date": "2025-01-15", "weight": 70.0}]
    }
    HealthProfile.objects.create(user=user, **test_profile_data)
    
    # Ensure the FoodItem table is empty.
    FoodItem.objects.all().delete()
    
    optimization_url = reverse("meal_plan_optimization")
    payload = {
        "goal": "maintain",
        "food_ids": []  # No food IDs provided.
    }
    response = client.post(optimization_url, data=payload, format="json")
    
    # Our updated expectation: even if no FoodItems exist, the endpoint returns a 200 with an empty plan.
    assert response.status_code == 200, f"Expected 200 when no FoodItems exist, got {response.status_code}"
    data = response.json()
    # We expect daily_targets to be returned (as passed in payload logic) and meal_plan to be an empty dict.
    assert isinstance(data.get("meal_plan"), dict)
    assert len(data["meal_plan"]) == 0, "Meal plan should be empty when no FoodItems exist"
