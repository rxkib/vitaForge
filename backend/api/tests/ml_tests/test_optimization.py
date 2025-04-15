import numpy as np
import pytest
import random

# Import functions from your optimization module.
from api.ml.optimization import (
    get_primary_macro_index,
    compute_macro_targets,
    compute_daily_macro_targets,
    generate_meal_plan_ga,
    generate_meal_plan
)
from api.constraints import compute_calorie_target

# --------------------------------------
# Test get_primary_macro_index
# --------------------------------------
def test_get_primary_macro_index_carbs():
    # Nutrient row: [protein, fat, carbs, cal_per_g, fiber]
    # Example: protein=0.2, fat=0.1, carbs=0.5 => reordered [0.5, 0.2, 0.1], max is at index 0.
    row = [0.2, 0.1, 0.5, 1.2, 0.02]
    assert get_primary_macro_index(row) == 0

def test_get_primary_macro_index_protein():
    # protein highest: protein=0.6, fat=0.1, carbs=0.3 -> reordered [0.3, 0.6, 0.1] so max index = 1.
    row = [0.6, 0.1, 0.3, 1.5, 0.04]
    assert get_primary_macro_index(row) == 1

def test_get_primary_macro_index_fat():
    # fat highest: protein=0.2, fat=0.5, carbs=0.3 -> reordered [0.3, 0.2, 0.5] so max index = 2.
    row = [0.2, 0.5, 0.3, 1.8, 0.03]
    assert get_primary_macro_index(row) == 2

# --------------------------------------
# Dummy Replacement for compute_calorie_target
# --------------------------------------
def dummy_compute_calorie_target(age, height_cm, weight_kg, goal):
    # For testing, always return 1800 calories.
    return 1800

@pytest.fixture(autouse=True)
def patch_compute_calorie_target(monkeypatch):
    monkeypatch.setattr("api.ml.optimization.compute_calorie_target", dummy_compute_calorie_target)

# --------------------------------------
# Test compute_macro_targets
# --------------------------------------
def test_compute_macro_targets():
    # With dummy TDEE = 1800 and meals_per_day = 3, meal_calories = 600.
    # For goal "maintain", ratios = (0.40, 0.40, 0.20).
    # Expected:
    #   target_carbs = (600 * 0.40) / 4 = 60
    #   target_protein = 60
    #   target_fat = (600 * 0.20) / 9 ≈ 13.33
    targets = compute_macro_targets(30, 170, 70, "maintain", meals_per_day=3)
    assert targets["calories"] == 600
    assert pytest.approx(targets["carbs"], rel=1e-2) == 60
    assert pytest.approx(targets["protein"], rel=1e-2) == 60
    assert pytest.approx(targets["fat"], rel=1e-2) == 13.33

# --------------------------------------
# Test compute_daily_macro_targets
# --------------------------------------
def test_compute_daily_macro_targets():
    # With dummy TDEE = 1800.
    # For "maintain": ratios = (0.50, 0.20, 0.30) and fiber fixed at 30.
    # Expected:
    #   target_carbs = (1800*0.50)/4 = 225
    #   target_protein = (1800*0.20)/4 = 90
    #   target_fat = (1800*0.30)/9 = 60
    targets = compute_daily_macro_targets(30, 170, 70, "maintain")
    assert targets["calories"] == 1800
    assert pytest.approx(targets["carbs"], rel=1e-2) == 225
    assert pytest.approx(targets["protein"], rel=1e-2) == 90
    assert pytest.approx(targets["fat"], rel=1e-2) == 60
    assert targets["fiber"] == 30

# --------------------------------------
# Dummy Replacements for GA and Data Retrieval
# --------------------------------------
def dummy_get_food_macro_data_with_names(food_ids):
    # Return fixed nutrient data (shape 2x5), food names, and categories.
    nutrient_data = np.array([
        [0.1, 0.05, 0.2, 1.2, 0.02],
        [0.2, 0.10, 0.3, 1.5, 0.03],
    ])
    names = ["Food A", "Food B"]
    categories = ["fruit", "vegetable"]
    return nutrient_data, names, categories

def dummy_genetic_algorithm_meal_plan(nutrient_data, daily_targets, min_portion, max_portion, min_foods, population_size, generations, recommended_max=None):
    # Return a fixed solution vector and a dummy fitness value.
    best_solution = np.array([100.0, 150.0])
    best_fitness = 123.45
    return best_solution, best_fitness

# --------------------------------------
# Test generate_meal_plan_ga
# --------------------------------------
@pytest.mark.parametrize("food_ids", [None, [1, 2]])
def test_generate_meal_plan_ga(monkeypatch, food_ids):
    monkeypatch.setattr("api.ml.optimization.get_food_macro_data_with_names", dummy_get_food_macro_data_with_names)
    monkeypatch.setattr("api.ml.optimization.genetic_algorithm_meal_plan", dummy_genetic_algorithm_meal_plan)
    
    daily_targets = {"calories": 600, "protein": 60, "fat": 20, "carbs": 60, "fiber": 30}
    plan, targets = generate_meal_plan_ga(food_ids, daily_targets, population_size=10, generations=5, min_portion=20, max_portion=500, min_foods=1)
    
    # Check that the plan returned is a dictionary with keys corresponding to the dummy food names.
    assert set(plan.keys()) == {"Food A", "Food B"}
    # Check that the daily targets remain unchanged.
    assert targets == daily_targets

# --------------------------------------
# Test generate_meal_plan (ga branch)
# --------------------------------------
def test_generate_meal_plan(monkeypatch):
    monkeypatch.setattr("api.ml.optimization.get_food_macro_data_with_names", dummy_get_food_macro_data_with_names)
    monkeypatch.setattr("api.ml.optimization.genetic_algorithm_meal_plan", dummy_genetic_algorithm_meal_plan)
    
    daily_targets = {"calories": 600, "protein": 60, "fat": 20, "carbs": 60, "fiber": 30}
    plan, targets = generate_meal_plan(None, daily_targets, method="ga", population_size=10, generations=5)
    assert set(plan.keys()) == {"Food A", "Food B"}
    assert targets == daily_targets
