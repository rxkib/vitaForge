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



# backend/api/constraints.py

def get_general_limits(calorie_target, meals_per_day=3):
    """
    Compute baseline daily nutrient targets scaled from a 2,000-calorie diet.
    For a 2,000-calorie diet, the recommendations are:
      Protein: ~50 g/day
      Total Fat: 44 to 78 g/day
      Carbohydrates: 225 to 325 g/day
      Dietary Fiber: 28 g/day
      Micronutrients:
        Vitamin B1: 1.15 mg/day
        Vitamin B2: 1.2 mg/day
        Vitamin B3: 15 mg/day
        Vitamin B5: 5 mg/day
        Vitamin B6: 1.3 mg/day
        Vitamin B7: 30 µg/day
        Vitamin B9: 400 µg/day
        Vitamin C: 82.5 mg/day
        Vitamin D: 20 µg/day
        Vitamin E: 15 mg/day
        Vitamin K: 105 µg/day
        Calcium: 1300 mg/day
        Iron: 13 mg/day
        Magnesium: 370 mg/day
        Potassium: 4700 mg/day
        Sodium: 2300 mg/day
        Zinc: 11 mg/day

    We compute per-calorie factors and then scale with calorie_target.
    """
    factor = calorie_target / 2000.0

    # Macronutrients (values in grams)
    protein = 50 * factor
    total_fat_lower = 44 * factor
    total_fat_upper = 78 * factor
    carbs_lower = 225 * factor
    carbs_upper = 325 * factor
    dietary_fiber = 28 * factor

    # Micronutrients (values in mg unless noted, µg for vitamins B7, B9, D, and K)
    vitamin_b1 = 1.15 * factor       # mg
    vitamin_b2 = 1.2 * factor        # mg
    vitamin_b3 = 15 * factor         # mg
    vitamin_b5 = 5 * factor          # mg
    vitamin_b6 = 1.3 * factor        # mg
    vitamin_b7 = 30 * factor         # µg
    vitamin_b9 = 400 * factor        # µg
    vitamin_c = 82.5 * factor        # mg
    vitamin_d = 20 * factor          # µg
    vitamin_e = 15 * factor          # mg
    vitamin_k = 105 * factor         # µg
    calcium = 1300 * factor          # mg
    iron = 13 * factor             # mg
    magnesium = 370 * factor         # mg
    potassium = 4700 * factor        # mg
    sodium = 2300 * factor           # mg
    zinc = 11 * factor             # mg

    return {
        "protein": protein,
        "total_fat_lower": total_fat_lower,
        "total_fat_upper": total_fat_upper,
        "carbohydrates_lower": carbs_lower,
        "carbohydrates_upper": carbs_upper,
        "dietary_fiber": dietary_fiber,
        "vitamin_b1": vitamin_b1,
        "vitamin_b2": vitamin_b2,
        "vitamin_b3": vitamin_b3,
        "vitamin_b5": vitamin_b5,
        "vitamin_b6": vitamin_b6,
        "vitamin_b7": vitamin_b7,
        "vitamin_b9": vitamin_b9,
        "vitamin_c": vitamin_c,
        "vitamin_d": vitamin_d,
        "vitamin_e": vitamin_e,
        "vitamin_k": vitamin_k,
        "calcium": calcium,
        "iron": iron,
        "magnesium": magnesium,
        "potassium": potassium,
        "sodium": sodium,
        "zinc": zinc,
    }


class GeneralConstraints:
    """
    Implements a penalty-based scoring system for users with no specific health condition.
    This constraint assesses whether a food item contributes to a baseline diet
    (approximately 2,000-calorie guidelines) by evaluating macronutrients and a suite of micronutrients.
    
    For nutrients with a recommended range (Total Fat and Carbohydrates),
    penalties are applied if the food’s value is below the lower bound or above the upper bound.
    For nutrients with a recommended minimum (Protein, Dietary Fiber, and all listed micronutrients),
    a penalty is applied if the food’s value is below the per-meal target.
    
    The overall score is the negative sum of all penalties; higher (less negative) scores indicate better
    alignment with the baseline nutritional recommendations.
    """
    def __init__(self, daily_limits, meals_per_day=3):
        self.meals = meals_per_day
        # Compute per-meal targets
        self.protein = daily_limits["protein"] / meals_per_day
        self.total_fat_lower = daily_limits["total_fat_lower"] / meals_per_day
        self.total_fat_upper = daily_limits["total_fat_upper"] / meals_per_day
        self.carbohydrates_lower = daily_limits["carbohydrates_lower"] / meals_per_day
        self.carbohydrates_upper = daily_limits["carbohydrates_upper"] / meals_per_day
        self.dietary_fiber = daily_limits["dietary_fiber"] / meals_per_day
        
        # For micronutrients, we assume only a minimum threshold is relevant.
        self.vitamin_b1 = daily_limits["vitamin_b1"] / meals_per_day
        self.vitamin_b2 = daily_limits["vitamin_b2"] / meals_per_day
        self.vitamin_b3 = daily_limits["vitamin_b3"] / meals_per_day
        self.vitamin_b5 = daily_limits["vitamin_b5"] / meals_per_day
        self.vitamin_b6 = daily_limits["vitamin_b6"] / meals_per_day
        self.vitamin_b7 = daily_limits["vitamin_b7"] / meals_per_day  # in µg
        self.vitamin_b9 = daily_limits["vitamin_b9"] / meals_per_day  # in µg
        self.vitamin_c = daily_limits["vitamin_c"] / meals_per_day
        self.vitamin_d = daily_limits["vitamin_d"] / meals_per_day  # in µg
        self.vitamin_e = daily_limits["vitamin_e"] / meals_per_day
        self.vitamin_k = daily_limits["vitamin_k"] / meals_per_day  # in µg
        self.calcium = daily_limits["calcium"] / meals_per_day
        self.iron = daily_limits["iron"] / meals_per_day
        self.magnesium = daily_limits["magnesium"] / meals_per_day
        self.potassium = daily_limits["potassium"] / meals_per_day
        self.sodium = daily_limits["sodium"] / meals_per_day
        self.zinc = daily_limits["zinc"] / meals_per_day

    def food_score(self, food):
        total_penalty = 0.0
        
        # Protein: Penalize if below per-meal minimum.
        protein = food.protein_g or 0.0
        total_penalty += penalty_below(protein, self.protein)
        
        # Total Fat: Penalize if below lower bound or above upper bound.
        fat = food.total_fat_g or 0.0
        total_penalty += penalty_below(fat, self.total_fat_lower)
        total_penalty += penalty_above(fat, self.total_fat_upper)
        
        # Carbohydrates: Use carbs_g (or total_available_cho_g); penalize if below or above range.
        carbs = food.carbs_g if food.carbs_g is not None else (food.total_available_cho_g or 0.0)
        total_penalty += penalty_below(carbs, self.carbohydrates_lower)
        total_penalty += penalty_above(carbs, self.carbohydrates_upper)
        
        # Dietary Fiber: Penalize if below recommended per-meal value.
        fiber = food.dietary_fibre_g or 0.0
        total_penalty += penalty_below(fiber, self.dietary_fiber)
        
        # Micronutrients: Penalize if below the per-meal recommended value.
        # We assume no penalty for values above the recommended amount.
        micronutrients = [
            ("vitamin_b1_mg", self.vitamin_b1),
            ("vitamin_b2_mg", self.vitamin_b2),
            ("vitamin_b3_mg", self.vitamin_b3),
            ("vitamin_b5_mg", self.vitamin_b5),
            ("vitamin_b6_mg", self.vitamin_b6),
            ("vitamin_b7_ug", self.vitamin_b7),
            ("vitamin_b9_ug", self.vitamin_b9),
            ("vitamin_c_mg", self.vitamin_c),
            ("vitamin_d2_ug", self.vitamin_d),  # or vitamin_d3_ug, depending on data availability
            ("vitamin_e_mg", self.vitamin_e),
            ("vitamin_k1_ug", self.vitamin_k),
            ("calcium_mg", self.calcium),
            ("iron_mg", self.iron),
            ("magnesium_mg", self.magnesium),
            ("potassium_mg", self.potassium),
            ("sodium_mg", self.sodium),
            ("zinc_mg", self.zinc),
        ]
        for field, target in micronutrients:
            value = getattr(food, field, None)
            if value is None:
                value = 0
            total_penalty += penalty_below(value, target)
        
        return -total_penalty
        

# Helper penalty functions remain the same:
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
    def __init__(self, constraints_list):
        self.constraints_list = constraints_list

    def food_score(self, food):
        return sum(constraint.food_score(food) for constraint in self.constraints_list)
