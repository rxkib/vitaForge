# backend/api/ml/meal_plan_optimizer.py

import numpy as np
from sklearn.cluster import KMeans
from .data_preprocessing import scale_nutritional_data  # using food_data already provided
from .clustering import get_representative_indices
from .optimization import compute_macro_targets, enumerate_meal_plans

def generate_meal_plan(food_data, macro_targets, n_clusters=3):
    """
    Generates an optimized meal plan based on macro targets and selected foods.

    Parameters:
      food_data (np.ndarray): Array of macro nutritional data for all food items (n_items x 3)
                              with columns [protein, fat, carbs] per 100g.
      macro_targets (dict): Macro targets computed via compute_macro_targets.
      n_clusters (int): Number of clusters to reduce the candidate set.
    
    Returns:
      meal_plans (list): A list of meal plan dictionaries (one per plan), where each dictionary maps
                         a food name to its portion size (in grams).
      selected_foods (np.ndarray): Nutritional data (macros) for the representative food items.
      macro_targets (dict): The macro targets used.
    """
    # Scale the provided food_data
    scaled_data, scaler = scale_nutritional_data(food_data)
    
    # Run KMeans clustering directly on the provided data
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(scaled_data)
    
    # Get representative indices from the clustering result
    rep_indices = get_representative_indices(cluster_labels, n_clusters)

    # Select representative foods from the provided food_data array
    selected_foods = food_data[rep_indices]
    
    # Create a list of food names for the selected items.
    # Replace this with actual food names if available.
    food_names = [f"Food_{i}" for i in rep_indices]
    
    # Generate multiple meal plans using the enumeration function.
    meal_plans = enumerate_meal_plans(
        macro_targets, 
        selected_foods, 
        food_names, 
        num_plans=3, 
        max_portion=500, 
        min_portion=20, 
        min_foods=3
    )
    
    return meal_plans, selected_foods, macro_targets

class MealPlanOptimizer:
    """
    Encapsulates the meal plan optimization process.
    """
    def __init__(self, food_data, macro_targets, n_clusters=3):
        """
        Initialize the optimizer.

        Parameters:
          food_data (np.ndarray): Macro nutritional data for all food items.
          macro_targets (dict): Macro targets (computed via compute_macro_targets).
          n_clusters (int): Number of clusters to reduce candidate food items.
        """
        self.food_data = food_data
        self.macro_targets = macro_targets
        self.n_clusters = n_clusters
    
    def generate_plan(self):
        """
        Generates the meal plan by running the complete ML pipeline.

        Returns:
          meal_plans (list): A list of meal plan dictionaries.
          selected_foods (np.ndarray): Macro data for the selected items.
          macro_targets (dict): The macro targets used.
        """
        return generate_meal_plan(self.food_data, self.macro_targets, self.n_clusters)

# Example usage for testing
if __name__ == "__main__":
    # Dummy macro data for testing: columns = [protein, fat, carbs] per 100g
    food_data = np.array([
        [15, 10, 30],
        [10, 5, 25],
        [20, 15, 40],
        [8, 4, 20],
        [12, 8, 28],
    ])
    
    # Example macro targets (could also be computed via compute_macro_targets)
    macro_targets = {
        "calories": 652.6333333333333,
        "protein": 81.57916666666667,
        "fat": 14.502962962962963,
        "carbs": 48.9475
    }
    
    optimizer = MealPlanOptimizer(food_data, macro_targets, n_clusters=3)
    meal_plans, selected_foods, targets = optimizer.generate_plan()
    
    print("Optimized Meal Plans:")
    for idx, plan in enumerate(meal_plans):
        print(f"Plan {idx+1}:")
        for food, portion in plan.items():
            print(f"  {food}: {portion:.1f} g")
