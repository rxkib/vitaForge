from pulp import LpProblem, LpVariable, LpMinimize, lpSum, LpBinary, LpStatus
from api.constraints import compute_calorie_target
from api.ml.data_preprocessing import get_food_macro_data_with_names
from api.ml.ga_optimizer import genetic_algorithm_meal_plan


# Updated mapping for continuous contribution.
# Our simplified approach will “assign” each food to its dominant macro:
# We define indices: 0 => Carbs, 1 => Protein, 2 => Fat.
CATEGORY_CONTRIBUTION = {
    0: {"protein": 0, "fat": 0, "carbs": 1.0},   # Carbs
    1: {"protein": 1.0, "fat": 0, "carbs": 0},     # Protein
    2: {"protein": 0, "fat": 1.0, "carbs": 0},     # Fat
}

def get_primary_macro_index(nutrient_row):
    """
    Given a nutrient row with order [protein, fat, carbs, cal_per_g, fiber],
    determine the dominant macro among protein, fat, and carbs.
    To align with our CATEGORY_CONTRIBUTION mapping, we remap:
      - If carbs is highest, return 0.
      - If protein is highest, return 1.
      - If fat is highest, return 2.
    """
    # Extract continuous values
    protein = nutrient_row[0]
    fat = nutrient_row[1]
    carbs = nutrient_row[2]
    # Rearranged list: [carbs, protein, fat]
    values = [carbs, protein, fat]
    max_index = values.index(max(values))
    return max_index

def compute_macro_targets(age, height_cm, weight_kg, goal, meals_per_day=3):
    daily_calories = compute_calorie_target(age, height_cm, weight_kg, goal)
    meal_calories = daily_calories / meals_per_day

    if goal == "lose":
        carbs_ratio, protein_ratio, fat_ratio = 0.30, 0.50, 0.20
    elif goal == "gain":
        carbs_ratio, protein_ratio, fat_ratio = 0.50, 0.30, 0.20
    else:  # maintain
        carbs_ratio, protein_ratio, fat_ratio = 0.40, 0.40, 0.20

    target_carbs = (meal_calories * carbs_ratio) / 4.0
    target_protein = (meal_calories * protein_ratio) / 4.0
    target_fat = (meal_calories * fat_ratio) / 9.0

    return {
        "calories": meal_calories,
        "carbs": target_carbs,
        "protein": target_protein,
        "fat": target_fat
    }

def compute_daily_macro_targets(age, height_cm, weight_kg, goal):
    TDEE = compute_calorie_target(age, height_cm, weight_kg, goal)
    ratio_carbs = 0.50
    ratio_protein = 0.20
    ratio_fat = 0.30
    target_carbs = (TDEE * ratio_carbs) / 4.0
    target_protein = (TDEE * ratio_protein) / 4.0
    target_fat = (TDEE * ratio_fat) / 9.0
    target_fiber = 30.0
    return {
        "calories": TDEE,
        "carbs": target_carbs,
        "protein": target_protein,
        "fat": target_fat,
        "fiber": target_fiber,
    }

def generate_meal_plan_ga(food_ids, daily_targets, population_size=50, generations=200, min_portion=20, max_portion=500, min_foods=3):
    """
    Generates a daily meal plan using a genetic algorithm.
    """
    # Extract continuous nutrient data.
    nutrient_data, food_names, categories = get_food_macro_data_with_names(food_ids)
    
    # You might want to check the dimensions here.
    # nutrient_data is an array of shape (n_items, 5)
    
    best_solution, best_fit = genetic_algorithm_meal_plan(
        nutrient_data, daily_targets, 
        min_portion=min_portion, max_portion=max_portion, 
        min_foods=min_foods, population_size=population_size, generations=generations
    )
    
    # Construct a plan as a dictionary mapping food names to portions.
    plan = {food_names[i]: best_solution[i] for i in range(len(food_names))}
    return plan, daily_targets

# Optionally, if you want to switch between LP and GA methods,
# you could add a parameter to select the optimizer.
def generate_meal_plan(food_ids, daily_targets, method="ga", **kwargs):
    if method == "ga":
        return generate_meal_plan_ga(food_ids, daily_targets, **kwargs)
    else:
        # Keep or call your existing LP-based function if needed.
        pass

if __name__ == "__main__":
    # Example usage for testing.
    food_ids = None  # or a list of food IDs.
    # Assume daily_targets computed from user profile:
    daily_targets = {
        "calories": 2000,
        "protein": 150,
        "fat": 70,
        "carbs": 250,
        "fiber": 30,
    }
    plan, targets = generate_meal_plan(food_ids, daily_targets, method="ga", population_size=50, generations=200)
    print("Optimized Meal Plan (GA):")
    for food, portion in plan.items():
        print(f"{food}: {portion:.1f} g")