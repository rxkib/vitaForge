# backend/api/ml/__init__.py

from .optimization import (
    compute_macro_targets,

)
from .data_preprocessing import get_food_category_data, scale_nutritional_data
from .clustering import cluster_foods
from .meal_plan_optimizer import MealPlanOptimizer
