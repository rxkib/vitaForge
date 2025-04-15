import numpy as np
import pytest
from api.ml.meal_plan_optimizer import (
    compute_recommended_max,
    generate_meal_plan,
    MealPlanOptimizer
)

# -------------------------------
# Test compute_recommended_max
# -------------------------------
def test_compute_recommended_max():
    # Given controlled categories and names.
    # For Food1: category "fruit", name "Food1" -> combined "fruit food1" contains "fruit" -> recommended max = 225.
    # For Food2: category "pasta", name "Food2" -> combined "pasta food2" does not match any mapping -> default value = 15.
    categories = ["fruit", "pasta"]
    names = ["Food1", "Food2"]
    rec_max = compute_recommended_max(categories, names)
    expected = np.array([225, 15])
    np.testing.assert_array_equal(rec_max, expected)

# -------------------------------
# Dummy Functions for GA Testing
# -------------------------------
def dummy_get_food_macro_data_with_names(food_ids):
    """
    Dummy function returning fixed nutrient data, food names, and categories.
    Nutrient data is a 2 x 5 numpy array.
    """
    nutrient_data = np.array([
        [1.0, 0.5, 0.2, 2.0, 0.1],
        [0.5, 0.2, 0.3, 1.5, 0.05],
    ])
    names = ["Food1", "Food2"]
    # For testing, use:
    # Food1 with category "fruit" (should match keyword "fruit")
    # Food2 with category "pasta" (should get default value)
    categories = ["fruit", "pasta"]
    return nutrient_data, names, categories

def dummy_genetic_algorithm_meal_plan(nutrient_data, daily_targets, min_portion, max_portion,
                                        min_foods, population_size, generations, recommended_max=None):
    """
    Dummy GA optimizer that always returns fixed solution vector and fitness.
    """
    best_solution = np.array([120.0, 200.0])
    best_fitness = 111.11
    return best_solution, best_fitness

# -------------------------------
# Tests for generate_meal_plan (GA-based)
# -------------------------------
@pytest.mark.parametrize("food_ids", [None, [1, 2]])
def test_generate_meal_plan_ga(monkeypatch, food_ids):
    # Patch get_food_macro_data_with_names and genetic_algorithm_meal_plan to use our dummy versions.
    monkeypatch.setattr("api.ml.meal_plan_optimizer.get_food_macro_data_with_names", dummy_get_food_macro_data_with_names)
    monkeypatch.setattr("api.ml.meal_plan_optimizer.genetic_algorithm_meal_plan", dummy_genetic_algorithm_meal_plan)
    
    daily_targets = {"calories": 600, "protein": 60, "fat": 20, "carbs": 60, "fiber": 30}
    # Call generate_meal_plan (which in GA branch calls generate_meal_plan_ga).
    plan, targets = generate_meal_plan(food_ids, daily_targets, population_size=10, generations=5, min_portion=20, max_portion=500)
    
    # Our dummy_get_food_macro_data_with_names returns food names ["Food1", "Food2"].
    # Our dummy_genetic_algorithm_meal_plan returns best_solution [120, 200].
    expected_plan = {"Food1": 120.0, "Food2": 200.0}
    assert plan == expected_plan
    assert targets == daily_targets

# -------------------------------
# Test MealPlanOptimizer Class
# -------------------------------
def test_meal_plan_optimizer(monkeypatch):
    monkeypatch.setattr("api.ml.meal_plan_optimizer.get_food_macro_data_with_names", dummy_get_food_macro_data_with_names)
    monkeypatch.setattr("api.ml.meal_plan_optimizer.genetic_algorithm_meal_plan", dummy_genetic_algorithm_meal_plan)
    
    daily_targets = {"calories": 600, "protein": 60, "fat": 20, "carbs": 60, "fiber": 30}
    optimizer = MealPlanOptimizer(food_ids=None, daily_targets=daily_targets)
    plan, targets = optimizer.generate_plan(population_size=10, generations=5, min_portion=20, max_portion=500)
    
    expected_plan = {"Food1": 120.0, "Food2": 200.0}
    assert plan == expected_plan
    assert targets == daily_targets
