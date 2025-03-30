import numpy as np
from api.models import FoodItem
import pandas as pd
from api.ml.data_preprocessing import scale_nutritional_data, get_food_macro_data_with_names
from api.ml.ga_optimizer import genetic_algorithm_meal_plan
from .optimization import compute_macro_targets, compute_daily_macro_targets

def generate_meal_plan(food_ids, daily_targets, **kwargs):
    """
    Generates an optimized meal plan using the genetic algorithm on the entire candidate set.
    Extra keyword arguments are passed to genetic_algorithm_meal_plan.
    """
    # Get continuous nutrient data and corresponding food names.
    food_data, food_names, _ = get_food_macro_data_with_names(food_ids)
    
    n_items = food_data.shape[0]
    
    # Force GA to use all foods by setting min_foods equal to the number of candidates.
    kwargs["min_foods"] = n_items
    
    # Run the genetic algorithm on the entire candidate set.
    best_solution, best_fit = genetic_algorithm_meal_plan(food_data, daily_targets, **kwargs)
    
    # Build a plan mapping each food name to its optimized portion.
    plan = {food_names[i]: best_solution[i] for i in range(n_items)}
    return plan, daily_targets


class MealPlanOptimizer:
    """
    Encapsulates the meal plan optimization process.
    """
    def __init__(self, food_ids, daily_targets):
        self.food_ids = food_ids
        self.daily_targets = daily_targets
    
    def generate_plan(self, **kwargs):
        return generate_meal_plan(self.food_ids, self.daily_targets, **kwargs)

if __name__ == "__main__":
    # Example usage for testing.
    food_ids = None  # Use all foods if no filter is provided.
    daily_targets = {
        "calories": 652.63,
        "protein": 81.58,
        "fat": 14.50,
        "carbs": 48.95,
        "fiber": 30.0
    }
    # Here, set min_foods equal to the total number of candidate foods if you want all included.
    optimizer = MealPlanOptimizer(food_ids, daily_targets)
    plan, targets = optimizer.generate_plan(population_size=50, generations=200, min_portion=20, max_portion=500, min_foods=7)
    print("Optimized Meal Plan (GA):")
    for food, portion in plan.items():
        print(f"{food}: {portion:.1f} g")
