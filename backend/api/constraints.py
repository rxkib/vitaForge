# backend/api/constraints.py

def compute_calorie_target(age, height_cm, weight_kg, goal):
    activity_factor = 1.2  # default sedentary lifestyle
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    tdee = bmr * activity_factor

    if goal == "lose":
        calorie_target = tdee - 500
    elif goal == "gain":
        calorie_target = tdee + 300
    else:
        calorie_target = tdee

    return max(calorie_target, 1500)


def get_diabetic_limits(calorie_target):
    daily_carb_target = (0.50 * calorie_target) / 4.0
    daily_carb_target = max(daily_carb_target, 130)
    sugar_limit_g = (0.10 * calorie_target) / 4.0
    fiber_min_g = 14.0 * (calorie_target / 1000.0)
    sat_fat_limit_g = (0.10 * calorie_target) / 9.0
    chol_limit_mg = 300.0

    return {
        "daily_carb_target_g": daily_carb_target,
        "sugar_limit_g": sugar_limit_g,
        "fiber_min_g": fiber_min_g,
        "sat_fat_limit_g": sat_fat_limit_g,
        "cholesterol_limit_mg": chol_limit_mg,
    }


def get_hypertension_limits(calorie_target):
    daily_carb_target = (0.50 * calorie_target) / 4.0
    daily_carb_target = max(daily_carb_target, 130)
    sodium_limit_mg = 1500.0  # ideal target for hypertension
    potassium_target_mg = 3510.0
    sat_fat_limit_g = (0.10 * calorie_target) / 9.0
    fiber_min_g = 25.0

    return {
        "daily_carb_target_g": daily_carb_target,
        "sodium_limit_mg": sodium_limit_mg,
        "potassium_target_mg": potassium_target_mg,
        "sat_fat_limit_g": sat_fat_limit_g,
        "fiber_min_g": fiber_min_g,
    }




class DiabetesConstraints:
    """
    Scores a FoodItem for diabetic recommendations based on:
      - Carbohydrates
      - Added Sugars
      - Dietary Fiber
      - Saturated Fat (mg to g conversion)
      - Cholesterol
    Carbohydrates are allowed ±20% around the per-meal target.
    """
    def __init__(self, daily_limits, meals_per_day=3):
        self.carb_target = daily_limits["daily_carb_target_g"] / meals_per_day
        self.sugar_limit = daily_limits["sugar_limit_g"] / meals_per_day
        self.fiber_min = daily_limits["fiber_min_g"] / meals_per_day
        self.sat_fat_limit = daily_limits["sat_fat_limit_g"] / meals_per_day
        self.chol_limit = daily_limits["cholesterol_limit_mg"] / meals_per_day

    def food_score(self, food):
        total_penalty = 0.0
        carbs = food.carbs_g if food.carbs_g is not None else (food.total_available_cho_g or 0.0)
        high_carb_limit = self.carb_target * 1.2
        low_carb_limit = self.carb_target * 0.8
        total_penalty += penalty_above(carbs, high_carb_limit)
        total_penalty += penalty_below(carbs, low_carb_limit)
        sugar = food.total_free_sugars_g or 0.0
        total_penalty += penalty_above(sugar, self.sugar_limit, weight=1.5)
        fiber = food.dietary_fibre_g or 0.0
        total_penalty += penalty_below(fiber, self.fiber_min)
        sat_fat_g = (food.total_saturated_fatty_acids_mg or 0.0) / 1000.0
        total_penalty += penalty_above(sat_fat_g, self.sat_fat_limit)
        chol = food.cholesterol_mg or 0.0
        total_penalty += penalty_above(chol, self.chol_limit, weight=1.2)
        return -total_penalty


class HypertensionConstraints:
    """
    Scores a FoodItem for hypertensive recommendations based on:
      - Carbohydrates
      - Dietary Fiber
      - Saturated Fat (mg to g conversion)
      - Sodium (converted from mg to g)
      - Potassium (converted from mg to g)
    Carbohydrates are allowed ±20% around the per-meal target.
    Foods with sodium above the per-meal limit are penalized,
    and foods with potassium below the per-meal target are penalized.
    """
    def __init__(self, daily_limits, meals_per_day=3):
        self.carb_target = daily_limits["daily_carb_target_g"] / meals_per_day
        self.sodium_limit_mg = daily_limits["sodium_limit_mg"]
        self.sodium_limit = (self.sodium_limit_mg / meals_per_day) / 1000.0  # in grams
        self.potassium_target_mg = daily_limits["potassium_target_mg"]
        self.potassium_target = (self.potassium_target_mg / meals_per_day) / 1000.0  # in grams
        self.sat_fat_limit = daily_limits["sat_fat_limit_g"] / meals_per_day
        self.fiber_min = daily_limits["fiber_min_g"] / meals_per_day

    def food_score(self, food):
        total_penalty = 0.0
        carbs = food.carbs_g if food.carbs_g is not None else (food.total_available_cho_g or 0.0)
        high_carb_limit = self.carb_target * 1.2
        low_carb_limit = self.carb_target * 0.8
        total_penalty += penalty_above(carbs, high_carb_limit)
        total_penalty += penalty_below(carbs, low_carb_limit)
        fiber = food.dietary_fibre_g or 0.0
        total_penalty += penalty_below(fiber, self.fiber_min)
        sat_fat_g = (food.total_saturated_fatty_acids_mg or 0.0) / 1000.0
        total_penalty += penalty_above(sat_fat_g, self.sat_fat_limit)
        sodium_g = (food.sodium_mg or 0.0) / 1000.0
        total_penalty += penalty_above(sodium_g, self.sodium_limit, weight=1.2)
        potassium_g = (food.potassium_mg or 0.0) / 1000.0
        total_penalty += penalty_below(potassium_g, self.potassium_target, weight=1.2)
        return -total_penalty


def get_heart_disease_limits(calorie_target):
    """
    Compute daily nutrient targets for heart disease based on a daily calorie target.
    
    The targets used are:
      - Total Carbohydrates: ~50% of calories, with a minimum of 130 g/day.
      - Saturated Fat: Less than 7% of calories. In grams, calculated as (0.07 * calorie_target) / 9.
      - Cholesterol: For heart disease, a stricter target of < 200 mg/day.
      - Sodium: < 2,300 mg per day.
      - Added Sugars: Ideal limit of ~6% of calories, computed as (0.06 * calorie_target) / 4.
      - Dietary Fiber: ≥ 25 g per day.
      
    Returns a dictionary of daily targets.
    """
    daily_carb_target = (0.50 * calorie_target) / 4.0
    daily_carb_target = max(daily_carb_target, 130)
    sat_fat_limit_g = (0.07 * calorie_target) / 9.0   # stricter limit (<7% of calories)
    cholesterol_limit_mg = 200.0                      # target for heart disease
    sodium_limit_mg = 2300.0                          # general sodium limit for heart disease
    sugar_limit_g = (0.06 * calorie_target) / 4.0     # ideal added sugars limit (~6% of calories)
    fiber_min_g = 25.0                                # minimum daily fiber
    
    return {
        "daily_carb_target_g": daily_carb_target,
        "sat_fat_limit_g": sat_fat_limit_g,
        "cholesterol_limit_mg": cholesterol_limit_mg,
        "sodium_limit_mg": sodium_limit_mg,
        "sugar_limit_g": sugar_limit_g,
        "fiber_min_g": fiber_min_g,
    }


class HeartDiseaseConstraints:
    """
    Implements a penalty‐based scoring system for heart disease.
    
    The scoring evaluates key nutrients in each FoodItem:
      - Carbohydrates are compared against a per-meal target (±20% tolerance).
      - Saturated Fat is penalized if it exceeds the per-meal limit (converted from mg to g).
      - Cholesterol is penalized if it exceeds the per-meal limit.
      - Sodium is evaluated by first converting mg to grams and then penalizing excess.
      - Added Sugars are penalized if they exceed the per-meal threshold (based on a 6% calorie limit).
      - Dietary Fiber is penalized if it falls below the per-meal minimum.
    
    The overall food score is the negative sum of all penalties (i.e. a higher score indicates better adherence to the heart-healthy profile).
    """
    def __init__(self, daily_limits, meals_per_day=3):
        # Per-meal targets are derived by dividing the daily target by the number of meals.
        self.carb_target = daily_limits["daily_carb_target_g"] / meals_per_day
        self.sat_fat_limit = daily_limits["sat_fat_limit_g"] / meals_per_day
        self.chol_limit = daily_limits["cholesterol_limit_mg"] / meals_per_day
        # Convert sodium from mg to grams.
        self.sodium_limit = (daily_limits["sodium_limit_mg"] / meals_per_day) / 1000.0
        # Added sugars limit per meal.
        self.sugar_limit = daily_limits["sugar_limit_g"] / meals_per_day
        self.fiber_min = daily_limits["fiber_min_g"] / meals_per_day

    def food_score(self, food):
        total_penalty = 0.0

        # Carbohydrates: apply a double-sided penalty for deviation beyond ±20%.
        carbs = food.carbs_g if food.carbs_g is not None else (food.total_available_cho_g or 0.0)
        high_carb_limit = self.carb_target * 1.2
        low_carb_limit = self.carb_target * 0.8
        total_penalty += penalty_above(carbs, high_carb_limit)
        total_penalty += penalty_below(carbs, low_carb_limit)

        # Saturated Fat: convert mg to grams, then penalize if above limit.
        sat_fat_g = (food.total_saturated_fatty_acids_mg or 0.0) / 1000.0
        total_penalty += penalty_above(sat_fat_g, self.sat_fat_limit)

        # Cholesterol: penalize if above per-meal limit.
        chol = food.cholesterol_mg or 0.0
        total_penalty += penalty_above(chol, self.chol_limit, weight=1.2)

        # Sodium: convert mg to grams and penalize excess.
        sodium_g = (food.sodium_mg or 0.0) / 1000.0
        total_penalty += penalty_above(sodium_g, self.sodium_limit, weight=1.2)

        # Added Sugars: penalize if above per-meal threshold.
        sugar = food.total_free_sugars_g or 0.0
        total_penalty += penalty_above(sugar, self.sugar_limit, weight=1.5)

        # Dietary Fiber: penalize if below the per-meal minimum.
        fiber = food.dietary_fibre_g or 0.0
        total_penalty += penalty_below(fiber, self.fiber_min)

        return -total_penalty  # A higher (less negative) score indicates better suitability


def get_high_cholesterol_limits(calorie_target):
    """
    Compute daily nutrient targets for individuals with high cholesterol.
    
    The targets used are:
      - Total Carbohydrates: ~50% of calories (minimum 130 g/day)
      - Saturated Fat: < 7% of total calories (calculated as (0.07 * calorie_target)/9 in grams)
      - Cholesterol: < 200 mg per day (for high LDL or familial hypercholesterolemia)
      - Added Sugars: Limit to ~7% of calories (approx. (0.07 * calorie_target)/4 grams)
      - Dietary Fiber: ≥ 25 g per day
      - Total Fat: Ideally within 25–35% of calories. Lower bound = (0.25 * calorie_target)/9,
        Upper bound = (0.35 * calorie_target)/9 in grams.
    """
    daily_carb_target = (0.50 * calorie_target) / 4.0
    daily_carb_target = max(daily_carb_target, 130)
    sat_fat_limit_g = (0.07 * calorie_target) / 9.0
    cholesterol_limit_mg = 200.0  # stricter limit for high LDL/familial hypercholesterolemia
    sugar_limit_g = (0.07 * calorie_target) / 4.0
    fiber_min_g = 25.0
    total_fat_lower_g = (0.25 * calorie_target) / 9.0
    total_fat_upper_g = (0.35 * calorie_target) / 9.0

    return {
        "daily_carb_target_g": daily_carb_target,
        "sat_fat_limit_g": sat_fat_limit_g,
        "cholesterol_limit_mg": cholesterol_limit_mg,
        "sugar_limit_g": sugar_limit_g,
        "fiber_min_g": fiber_min_g,
        "total_fat_lower_g": total_fat_lower_g,
        "total_fat_upper_g": total_fat_upper_g,
    }


class HighCholesterolConstraints:
    """
    Implements a penalty-based scoring system for food items in individuals with high cholesterol.
    
    Key Evaluated Nutrients:
      - Carbohydrates: Allowed ±20% deviation from the per-meal target.
      - Saturated Fat: Foods exceeding the per-meal limit (converted from mg to g) are penalized.
      - Cholesterol: Foods exceeding the per-meal cholesterol threshold incur a penalty.
      - Added Sugars: Foods with free sugars above the per-meal limit are penalized.
      - Dietary Fiber: Foods with fiber below the per-meal minimum are penalized.
      - Total Fat: Overall fat intake is assessed; penalties are imposed for values below the lower bound 
        or above the upper bound of the recommended range.
        
    The overall food score is the negative sum of all individual penalties so that a higher (less negative)
    score indicates a food that better meets the high-cholesterol guidelines.
    """
    def __init__(self, daily_limits, meals_per_day=3):
        self.carb_target = daily_limits["daily_carb_target_g"] / meals_per_day
        self.sat_fat_limit = daily_limits["sat_fat_limit_g"] / meals_per_day
        self.chol_limit = daily_limits["cholesterol_limit_mg"] / meals_per_day
        self.sugar_limit = daily_limits["sugar_limit_g"] / meals_per_day
        self.fiber_min = daily_limits["fiber_min_g"] / meals_per_day
        self.total_fat_lower = daily_limits["total_fat_lower_g"] / meals_per_day
        self.total_fat_upper = daily_limits["total_fat_upper_g"] / meals_per_day

    def food_score(self, food):
        total_penalty = 0.0

        # Carbohydrates: Apply double-sided penalty for deviation beyond ±20%.
        carbs = food.carbs_g if food.carbs_g is not None else (food.total_available_cho_g or 0.0)
        high_carb_limit = self.carb_target * 1.2
        low_carb_limit = self.carb_target * 0.8
        total_penalty += penalty_above(carbs, high_carb_limit)
        total_penalty += penalty_below(carbs, low_carb_limit)

        # Saturated Fat: Convert mg to grams and penalize if above per-meal limit.
        sat_fat_g = (food.total_saturated_fatty_acids_mg or 0.0) / 1000.0
        total_penalty += penalty_above(sat_fat_g, self.sat_fat_limit)

        # Cholesterol: Penalize if above per-meal threshold.
        chol = food.cholesterol_mg or 0.0
        total_penalty += penalty_above(chol, self.chol_limit, weight=1.2)

        # Added Sugars: Penalize if above per-meal threshold.
        sugar = food.total_free_sugars_g or 0.0
        total_penalty += penalty_above(sugar, self.sugar_limit, weight=1.5)

        # Dietary Fiber: Penalize if below per-meal minimum.
        fiber = food.dietary_fibre_g or 0.0
        total_penalty += penalty_below(fiber, self.fiber_min)

        # Total Fat: Use food.total_fat_g and apply double-sided penalty.
        total_fat = food.total_fat_g or 0.0
        total_penalty += penalty_below(total_fat, self.total_fat_lower)
        total_penalty += penalty_above(total_fat, self.total_fat_upper)

        return -total_penalty


def get_arthritis_limits(calorie_target):
    """
    Compute daily nutrient targets for arthritis management.
    
    Targets for arthritis focus on minimizing pro-inflammatory fats
    and added sugars while ensuring sufficient fiber intake.
    
    - Saturated Fat: Less than 10% of total calories,
      i.e. (0.10 * calorie_target) / 9 in grams.
    - Omega-6 Fatty Acids (Linoleic): While no strict daily limit is set,
      we impose a threshold to avoid excessive intake. Here, we assume an upper bound
      of 4000 mg per day.
    - Added Sugars: Less than 10% of daily calories,
      i.e. (0.10 * calorie_target) / 4 in grams.
    - Dietary Fiber: A minimum of 25 g per day is recommended.
    """
    sat_fat_limit_g = (0.10 * calorie_target) / 9.0
    linoleic_limit_mg = 4000.0  # daily threshold for omega-6 (linoleic) in mg
    sugar_limit_g = (0.10 * calorie_target) / 4.0
    fiber_min_g = 25.0

    return {
        "sat_fat_limit_g": sat_fat_limit_g,
        "linoleic_limit_mg": linoleic_limit_mg,
        "sugar_limit_g": sugar_limit_g,
        "fiber_min_g": fiber_min_g,
    }


class ArthritisConstraints:
    """
    Implements a penalty‐based scoring system for arthritis.
    
    Evaluated Nutrients:
      - Saturated Fat: Foods exceeding the per-meal limit (converted from mg to grams)
        incur a penalty.
      - Omega-6 Fatty Acids (Linoleic): Although essential, excessive intake (above a set threshold)
        may lead to inflammation. Foods with linoleic acid values beyond the per-meal threshold
        incur a penalty (with a lower weight factor).
      - Added Sugars: Foods with free sugars above the per-meal threshold incur a penalty.
      - Dietary Fiber: Foods with fiber content below the per-meal minimum are penalized.
      
    The overall score is the negative sum of these penalties so that a higher (less negative) score
    indicates better suitability for an arthritis-friendly diet.
    """
    def __init__(self, daily_limits, meals_per_day=3):
        self.sat_fat_limit = daily_limits["sat_fat_limit_g"] / meals_per_day
        self.linoleic_limit_mg = daily_limits["linoleic_limit_mg"] / meals_per_day
        self.sugar_limit = daily_limits["sugar_limit_g"] / meals_per_day
        self.fiber_min = daily_limits["fiber_min_g"] / meals_per_day

    def food_score(self, food):
        total_penalty = 0.0

        # Saturated Fat: Convert mg to grams and penalize if above per-meal limit.
        sat_fat_g = (food.total_saturated_fatty_acids_mg or 0.0) / 1000.0
        total_penalty += penalty_above(sat_fat_g, self.sat_fat_limit)

        # Omega-6 (Linoleic): Penalize if food's linoleic acid (in mg) exceeds per-meal threshold.
        linoleic_mg = food.linoleic_mg or 0.0
        total_penalty += penalty_above(linoleic_mg, self.linoleic_limit_mg, weight=0.5)

        # Added Sugars: Penalize if above per-meal threshold.
        sugar = food.total_free_sugars_g or 0.0
        total_penalty += penalty_above(sugar, self.sugar_limit, weight=1.5)

        # Dietary Fiber: Penalize if below per-meal minimum.
        fiber = food.dietary_fibre_g or 0.0
        total_penalty += penalty_below(fiber, self.fiber_min)

        return -total_penalty



# Helper penalty functions (used by all constraint classes)
def penalty_above(value, limit, weight=1.0):
    if value is None:
        return 0
    diff = value - limit
    return weight * (diff ** 2) if diff > 0 else 0

def penalty_below(value, limit, weight=1.0):
    if value is None:
        return 0
    diff = limit - value
    return weight * (diff ** 2) if diff > 0 else 0


class CompositeConstraints:
    """
    Aggregates multiple constraint objects.
    
    The composite food_score is defined as the sum of the scores from each constraint.
    """
    def __init__(self, constraints_list):
        self.constraints_list = constraints_list

    def food_score(self, food):
        return sum(constraint.food_score(food) for constraint in self.constraints_list)