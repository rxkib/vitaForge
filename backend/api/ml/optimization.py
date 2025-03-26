# backend/api/ml/optimization.py
from pulp import LpProblem, LpVariable, LpMinimize, lpSum, LpBinary, LpStatus
from api.constraints import compute_calorie_target

def compute_macro_targets(age, height_cm, weight_kg, goal, meals_per_day=3):
    daily_calories = compute_calorie_target(age, height_cm, weight_kg, goal)
    meal_calories = daily_calories / meals_per_day

    if goal == "lose":
        carbs_ratio, protein_ratio, fat_ratio = 0.30, 0.50, 0.20
    elif goal == "gain":
        carbs_ratio, protein_ratio, fat_ratio = 0.50, 0.30, 0.20
    else:  # maintain
        carbs_ratio, protein_ratio, fat_ratio = 0.40, 0.40, 0.20

    target_carbs = (meal_calories * carbs_ratio) / 4.0  # 4 calories per gram for carbs
    target_protein = (meal_calories * protein_ratio) / 4.0  # 4 calories per gram for protein
    target_fat = (meal_calories * fat_ratio) / 9.0  # 9 calories per gram for fat

    return {
        "calories": meal_calories,
        "carbs": target_carbs,
        "protein": target_protein,
        "fat": target_fat
    }

def optimize_meal_plan_macro(macro_targets, nutrient_data, food_names, max_portion=500, min_portion=20, min_foods=3):
    n_items = nutrient_data.shape[0]
    if n_items < min_foods:
        raise ValueError(f"At least {min_foods} foods must be selected; got {n_items}.")

    prob = LpProblem("MealPlanMacroOptimization", LpMinimize)
    # Decision variables: x[i] = portion size (g); y[i] = binary (1 if used)
    x = [LpVariable(f"x_{i}", lowBound=0, upBound=max_portion) for i in range(n_items)]
    y = [LpVariable(f"y_{i}", cat=LpBinary) for i in range(n_items)]

    for i in range(n_items):
        prob += x[i] >= min_portion * y[i], f"MinPortion_{i}"
        prob += x[i] <= max_portion * y[i], f"MaxPortion_{i}"

    prob += lpSum(y[i] for i in range(n_items)) >= min_foods, "MinFoods"
    prob += lpSum(x)

    # Macro nutrient constraints: nutrient_data columns: 0 = protein, 1 = fat, 2 = carbs.
    for macro, idx in zip(["protein", "fat", "carbs"], [0, 1, 2]):
        prob += lpSum(nutrient_data[i, idx] * ((1/100.0) * x[i]) for i in range(n_items)) >= macro_targets[macro], f"min_{macro}"

    result = prob.solve()
    print("Optimization Status:", LpStatus[prob.status])
    for i in range(n_items):
        print(f"{food_names[i]}: x = {x[i].varValue}, y = {y[i].varValue}")

    portions = {food_names[i]: x[i].varValue for i in range(n_items)}
    return portions

def enumerate_meal_plans(macro_targets, nutrient_data, food_names, num_plans=3, **kwargs):
    solutions = []
    n_items = nutrient_data.shape[0]

    for k in range(num_plans):
        prob = LpProblem(f"MealPlanMacroOptimization_{k}", LpMinimize)
        x = [LpVariable(f"x_{i}", lowBound=0, upBound=kwargs.get("max_portion", 500))
             for i in range(n_items)]
        y = [LpVariable(f"y_{i}", cat=LpBinary) for i in range(n_items)]

        # Linking constraints for portion sizes and binary selection
        for i in range(n_items):
            prob += x[i] >= kwargs.get("min_portion", 20) * y[i], f"MinPortion_{i}"
            prob += x[i] <= kwargs.get("max_portion", 500) * y[i], f"MaxPortion_{i}"

        prob += lpSum(y[i] for i in range(n_items)) >= kwargs.get("min_foods", 3), "MinFoods"
        prob += lpSum(x)

        # Macro nutrient constraints: columns: 0 = protein, 1 = fat, 2 = carbs.
        for macro, idx in zip(["protein", "fat", "carbs"], [0, 1, 2]):
            prob += lpSum(nutrient_data[i, idx] * ((1 / 100.0) * x[i]) for i in range(n_items)) >= macro_targets[macro], f"min_{macro}"

        # Exclude previous solutions by forcing at least one binary variable to differ.
        for j, sol in enumerate(solutions):
            constraint_name = f"ExcludeSolution_{k}_{j}"
            prob += lpSum((1 - y[i]) if sol.get(food_names[i], 0) > 0 else y[i] for i in range(n_items)) >= 1, constraint_name

        prob.solve()
        sol_dict = {food_names[i]: x[i].varValue for i in range(n_items)}
        solutions.append(sol_dict)

    return solutions


if __name__ == '__main__':
    # Example usage (replace with actual parameters as needed)
    age, height_cm, weight_kg, goal = 30, 175, 70, "maintain"
    macro_targets = compute_macro_targets(age, height_cm, weight_kg, goal)
    print("Macro Targets:", macro_targets)
