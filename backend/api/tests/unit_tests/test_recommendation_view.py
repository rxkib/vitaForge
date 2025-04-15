import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from api.models import HealthProfile, FoodItem
from django.utils import timezone

User = get_user_model()

# --- Dummy Composite for testing RecommendationView scoring ---
class DummyComposite:
    def __init__(self, constraints_list):
        # We ignore the constraints_list in this dummy.
        pass
    def food_score(self, food):
        # Return 10 if food name is "Food A", else 5.
        return 10 if food.name == "Food A" else 5

@pytest.mark.django_db
def test_recommendation_view_no_health_profile():
    """
    Test GET for RecommendationView when the user's HealthProfile does not exist.
    Expect a 404 error with an appropriate error message.
    """
    client = APIClient()
    
    # Create a test user without a HealthProfile.
    user = User.objects.create_user(
        username="noprofile@example.com",
        email="noprofile@example.com",
        password="password"
    )
    client.force_authenticate(user=user)
    
    url = reverse("recommendations")
    response = client.get(url)
    
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"] == "Health profile not found. Please set up your health profile."

@pytest.mark.django_db
def test_recommendation_view_success(monkeypatch):
    """
    Test GET for RecommendationView when a HealthProfile exists and FoodItems are present.
    This test creates a HealthProfile, two FoodItems, and monkey-patches CompositeConstraints
    to use a dummy food scoring function. It then checks that the recommended foods are correctly grouped.
    """
    client = APIClient()
    
    # Create a test user.
    user = User.objects.create_user(
        username="rec@example.com",
        email="rec@example.com",
        password="password"
    )
    client.force_authenticate(user=user)
    
    # Create a HealthProfile for the user.
    # Use non_vegetarian so that no dietary preference filters are applied.
    profile = HealthProfile.objects.create(
        user=user,
        age=30,
        height=170,  # centimeters
        weight=70,
        health_conditions="diabetes",  # will result in conditions list ["diabetes"]
        dietary_preference="non_vegetarian",
        weight_history=[{"date": timezone.now().strftime("%Y-%m-%d"), "weight": 70}]
    )
    
    # Create two FoodItems.
    # Food A with tag "fruit" should be grouped as "Fruit"
    food_a = FoodItem.objects.create(
        name="Food A",
        tags="fruit",
        region="Both",
        protein_g=1,
        carbs_g=1,
        total_fat_g=1
    )
    # Food B with tag "vegetable" should be grouped as "Vegetable"
    food_b = FoodItem.objects.create(
        name="Food B",
        tags="vegetable",
        region="Both",
        protein_g=1,
        carbs_g=1,
        total_fat_g=1
    )
    
    # Since RecommendationView builds constraints by calling a number of functions,
    # we monkeypatch CompositeConstraints in the view module to use our DummyComposite.
    monkeypatch.setattr('api.views.CompositeConstraints', DummyComposite)
    
    # Set the URL query parameters as needed.
    # In this test we won't pass a "condition" parameter, so the view will use the health_conditions from the profile.
    url = reverse("recommendations")  # Ensure the URL name "recommendations" matches your urls.py.
    # Optionally, add a goal parameter, e.g., maintain.
    response = client.get(url, data={"goal": "maintain"})
    assert response.status_code == 200
    data = response.json()
    
    # The view returns a dict with a key "recommended_foods" that maps macro groups to lists.
    # Our get_macro_group function in the view:
    #   - For food_a, tag "fruit" returns "Fruit".
    #   - For food_b, tag "vegetable" returns "Vegetable".
    assert "recommended_foods" in data
    rec_foods = data["recommended_foods"]
    
    # Check that the groups "Fruit" and "Vegetable" are present.
    assert "Fruit" in rec_foods
    assert "Vegetable" in rec_foods
    
    # Check the scoring:
    # Our DummyComposite returns 10 for Food A and 5 for Food B.
    # The view rounds score to two decimals.
    food_a_data = rec_foods["Fruit"]
    food_b_data = rec_foods["Vegetable"]
    
    # There should be at least one entry for each group.
    assert len(food_a_data) >= 1
    assert len(food_b_data) >= 1
    
    # Verify that Food A in the "Fruit" group has the expected values.
    # We assume the view includes "food_id", "name", "score" and other fields.
    food_a_entry = next((item for item in food_a_data if item["name"] == "Food A"), None)
    assert food_a_entry is not None
    assert food_a_entry["score"] == 10.00
    
    # Similarly, verify Food B.
    food_b_entry = next((item for item in food_b_data if item["name"] == "Food B"), None)
    assert food_b_entry is not None
    assert food_b_entry["score"] == 5.00
