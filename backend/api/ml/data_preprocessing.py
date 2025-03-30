import pandas as pd
from api.models import FoodItem
import numpy as np
from sklearn.preprocessing import StandardScaler

def get_food_category_data(food_ids=None):
    """
    Returns a numpy array of one-hot encoded categories for each food.
    The mapping is based on the food's tags:
      - "grains"               -> Carbs
      - "vegetable", "vegetables", "fruit", "fruits", "leafy vegetable" -> Fibre
      - "fish", "red meat", "offal", "egg", "poultry", "legume"          -> Protein
      - "oil", "dairy", "nut"   -> Fat
      - any other              -> Others
    Order is: [Carbs, Protein, Fat, Fibre, Others]
    """
    TAG_TO_CATEGORY = {
        "grains": "Carbs",
        "vegetable": "Fibre",
        "vegetables": "Fibre",
        "fruit": "Fibre",
        "fruits": "Fibre",
        "leafy vegetable": "Fibre",
        "fish": "Protein",
        "red meat": "Protein",
        "offal": "Protein",
        "egg": "Protein",
        "poultry": "Protein",
        "legume": "Protein",
        "oil": "Fat",
        "dairy": "Fat",
        "nut": "Fat",
    }
    CATEGORY_ORDER = ["Carbs", "Protein", "Fat", "Fibre", "Others"]
    
    qs = FoodItem.objects.all()
    if food_ids is not None:
        qs = qs.filter(id__in=food_ids)
    data = []
    for food in qs:
        if food.tags:
            tags = [t.strip().lower() for t in food.tags.split(",")]
            category = None
            for t in tags:
                if t in TAG_TO_CATEGORY:
                    category = TAG_TO_CATEGORY[t]
                    break
            if not category:
                category = "Others"
        else:
            category = "Others"
        # One-hot encode the category
        one_hot = [1 if category == cat else 0 for cat in CATEGORY_ORDER]
        data.append(one_hot)
    return np.array(data)

def get_food_macro_data_with_names(food_ids=None):
    """
    Returns continuous nutritional data for each food:
      - protein, fat, carbs, calories per gram, and fiber (all per gram)
    along with the food names and the full tag string.
    Missing nutrient values are filled with 0 (or, for energy_kj, the column mean).
    """
    qs = FoodItem.objects.all()
    if food_ids:
        qs = qs.filter(id__in=food_ids)
    qs_data = qs.values(
        'protein_g', 'total_fat_g', 'carbs_g', 'total_available_cho_g', 
        'energy_kj', 'dietary_fibre_g', 'name', 'tags'
    )
    df = pd.DataFrame(list(qs_data))
    
    # Ensure the critical columns exist; if not, create them with default 0.
    for col in ['protein_g', 'total_fat_g', 'carbs_g', 'total_available_cho_g', 'energy_kj', 'dietary_fibre_g']:
        if col not in df.columns:
            df[col] = 0

    # For energy_kj, fill missing values with the mean.
    df['energy_kj'] = df['energy_kj'].fillna(df['energy_kj'].mean())
    
    # Fill missing values for protein_g and total_fat_g with 0.
    df['protein_g'] = df['protein_g'].fillna(0)
    df['total_fat_g'] = df['total_fat_g'].fillna(0)
    
    # For carbs: if carbs_g is not available, use total_available_cho_g; if both missing, use 0.
    df['carbs'] = df.apply(
        lambda row: (row['carbs_g'] if pd.notnull(row['carbs_g']) 
                     else (row['total_available_cho_g'] if pd.notnull(row['total_available_cho_g']) else 0)) / 100.0,
        axis=1
    )
    
    # Convert per-100g values to per-gram.
    df['protein'] = df['protein_g'] / 100.0
    df['fat'] = df['total_fat_g'] / 100.0
    
    # Convert energy_kj (per 100g) to calories per gram.
    df['cal_per_g'] = df['energy_kj'] / 4.184 / 100.0
    
    # Fiber: fill missing values with 0.
    df['fiber'] = df['dietary_fibre_g'].fillna(0) / 100.0

    # Keep the full tag string (lowercased) for later diversity matching.
    df['category'] = df['tags'].fillna("others").str.lower()
    
    food_data = df[['protein', 'fat', 'carbs', 'cal_per_g', 'fiber']].to_numpy()
    names = list(df['name'])
    categories = list(df['category'])
    return food_data, names, categories


def scale_nutritional_data(data_array):
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(data_array)
    return scaled_data, scaler

if __name__ == '__main__':
    data_array = get_food_category_data()
    print("Category Data:")
    print(data_array)
