# backend/api/ml/__init__.py

from .optimization import (
    compute_macro_targets,
    optimize_meal_plan_macro,
    enumerate_meal_plans
)
from .data_preprocessing import get_food_macro_data, scale_nutritional_data
from .clustering import cluster_foods
from .meal_plan_optimizer import MealPlanOptimizer
