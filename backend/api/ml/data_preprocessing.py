# backend/api/ml/data_preprocessing.py
import pandas as pd
from api.models import FoodItem

# Optional: Remove or comment out this function if not needed for macro optimization.
# def get_food_nutritional_data(food_ids=None):
#     qs = FoodItem.objects.all()
#     if food_ids is not None:
#         qs = qs.filter(id__in=food_ids)
#     qs = qs.values(
#         'energy_kj', 'protein_g', 'total_fat_g', 'carbs_g', 
#         'total_available_cho_g', 'dietary_fibre_g'
#     )
#     df = pd.DataFrame(list(qs))
#     # Convert and process additional nutrients as needed...
#     return df[['calories', 'protein', 'fat', 'carbs', 'fibre']].to_numpy()

def get_food_macro_data(food_ids=None):
    qs = FoodItem.objects.all()
    if food_ids is not None:
        qs = qs.filter(id__in=food_ids)
    qs = qs.values('protein_g', 'total_fat_g', 'carbs_g', 'total_available_cho_g')
    df = pd.DataFrame(list(qs))
    # For carbs, prefer 'carbs_g'; otherwise, use 'total_available_cho_g'
    df['carbs'] = df.apply(
        lambda row: row['carbs_g'] if pd.notnull(row['carbs_g'])
        else (row['total_available_cho_g'] if pd.notnull(row['total_available_cho_g']) else 0),
        axis=1
    )
    # Fill missing protein and fat values with 0
    df['protein'] = df['protein_g'].fillna(0)
    df['fat'] = df['total_fat_g'].fillna(0)
    # Return macros in order: protein, fat, carbs
    return df[['protein', 'fat', 'carbs']].to_numpy()

def scale_nutritional_data(data_array):
    from sklearn.preprocessing import StandardScaler
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(data_array)
    return scaled_data, scaler

if __name__ == '__main__':
    data_array = get_food_macro_data()
    print("Macro Data:")
    print(data_array)
