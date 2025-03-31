import numpy as np
from api.models import FoodItem
import pandas as pd
from api.ml.data_preprocessing import scale_nutritional_data, get_food_macro_data_with_names
from api.ml.ga_optimizer import genetic_algorithm_meal_plan
from .optimization import compute_daily_macro_targets

def compute_recommended_max(categories, names):
    # Define mapping as (list of keywords, recommended max serving)
    mapping = [
        (["fruit"], 225),
        (["grains"], 350),
        (["vegetable", "leafy vegetable"], 400),
        (["legume", "poultry", "offal", "egg", "fish", "paneer", "milk", "red meat"], 250),
        (["oil", "condiment", "confectionery", "sweetener", "butter"], 10),
        (["coffee"], 10),
        (["nut", "peanut", "seed"], 30),
        (["dried fruit"], 20),
        (["coconut water"], 300),
        (["parmesan cheese", "parmesan cheese", "cheddar cheese"], 50),
        (["plain yogurt", "greek yogurt"], 500)
    ]
    default_val = 15
    rec_max = []
    for cat, name in zip(categories, names):
        # Combine category and name (both lowercased) for matching.
        combined = f"{cat} {name.lower()}"
        assigned = False
        for keywords, max_val in mapping:
            if any(kw in combined for kw in keywords):
                rec_max.append(max_val)
                assigned = True
                break
        if not assigned:
            rec_max.append(default_val)
    return np.array(rec_max)

def generate_meal_plan(food_ids, daily_targets, **kwargs):
    """
    Generates an optimized meal plan using the genetic algorithm on the entire candidate set.
    Extra keyword arguments are passed to genetic_algorithm_meal_plan.
    """
    # Get continuous nutrient data, food names, and categories.
    food_data, food_names, categories = get_food_macro_data_with_names(food_ids)
    n_items = food_data.shape[0]
    
    # Force GA to use all foods.
    kwargs["min_foods"] = n_items
    
    # Compute recommended maximum serving sizes for each food.
    recommended_max = compute_recommended_max(categories, food_names)
    kwargs["recommended_max"] = recommended_max
    
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
    food_ids = None  # Use all foods if no filter is provided.
    daily_targets = {
        "calories": 652.63,
        "protein": 81.58,
        "fat": 14.50,
        "carbs": 48.95,
        "fiber": 30.0
    }
    optimizer = MealPlanOptimizer(food_ids, daily_targets)
    plan, targets = optimizer.generate_plan(population_size=50, generations=200, min_portion=20, max_portion=500)
    print("Optimized Meal Plan (GA):")
    for food, portion in plan.items():
        print(f"{food}: {portion:.1f} g")
