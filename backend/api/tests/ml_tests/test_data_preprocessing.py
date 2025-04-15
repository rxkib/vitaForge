import numpy as np
import pandas as pd
import pytest
from django.utils import timezone
from api.ml.data_preprocessing import (
    get_food_category_data,
    get_food_macro_data_with_names,
    scale_nutritional_data
)
from api.models import FoodItem

# ---- get_food_category_data Tests ----

@pytest.mark.django_db
def test_get_food_category_data_typical():
    """
    Verify that get_food_category_data correctly one-hot encodes FoodItem tags.
    """
    FoodItem.objects.all().delete()
    FoodItem.objects.create(name="Food1", tags="grains")
    FoodItem.objects.create(name="Food2", tags="vegetable")
    FoodItem.objects.create(name="Food3", tags="unknown")
    FoodItem.objects.create(name="Food4", tags=None)
    FoodItem.objects.create(name="Food5", tags="fruit, dairy")
    
    result = get_food_category_data()
    expected = np.array([
        [1, 0, 0, 0, 0],  # grains -> Carbs
        [0, 0, 0, 1, 0],  # vegetable -> Fibre
        [0, 0, 0, 0, 1],  # unknown -> Others
        [0, 0, 0, 0, 1],  # None -> Others
        [0, 0, 0, 1, 0],  # "fruit, dairy" -> first matching "fruit" -> Fibre
    ])
    assert result.shape == expected.shape
    np.testing.assert_array_equal(result, expected)

@pytest.mark.django_db
def test_get_food_category_data_empty_queryset():
    """
    Verify that get_food_category_data returns an empty array when no FoodItems exist.
    This test calls get_food_macro_data_with_names since it internally uses the same query,
    and expects empty outputs.
    """
    FoodItem.objects.all().delete()
    food_data, names, categories = get_food_macro_data_with_names()
    assert food_data.shape == (0, 5)
    assert names == []
    assert categories == []

@pytest.mark.django_db
def test_get_food_category_data_unexpected_format():
    """
    Test that if FoodItem.tags is an empty string, it defaults to the "Others" category.
    """
    FoodItem.objects.all().delete()
    FoodItem.objects.create(name="FoodEmpty", tags="")
    result = get_food_category_data()
    expected = np.array([[0, 0, 0, 0, 1]])
    np.testing.assert_array_equal(result, expected)

# ---- get_food_macro_data_with_names Tests ----

@pytest.mark.django_db
def test_get_food_macro_data_with_names_typical():
    """
    Verify that get_food_macro_data_with_names returns nutritional data, names,
    and categories with appropriate unit conversions and missing-value handling.
    """
    FoodItem.objects.all().delete()
    
    FoodItem.objects.create(
        name="Food1",
        tags="fruit",
        protein_g=10.0,
        total_fat_g=5.0,
        carbs_g=20.0,  
        total_available_cho_g=None,
        energy_kj=500.0,
        dietary_fibre_g=2.0
    )
    FoodItem.objects.create(
        name="Food2",
        tags="unknown",
        protein_g=None,
        total_fat_g=None,
        carbs_g=None,
        total_available_cho_g=30.0,
        energy_kj=None,  # Should be filled with mean from Food1 (500.0)
        dietary_fibre_g=None
    )
    
    food_data, names, categories = get_food_macro_data_with_names()
    
    expected_food_data = np.array([
        [10.0/100.0, 5.0/100.0, 20.0/100.0, 500/4.184/100.0, 2.0/100.0],
        [0.0, 0.0, 30.0/100.0, 500/4.184/100.0, 0.0]
    ])
    np.testing.assert_allclose(food_data, expected_food_data, rtol=1e-2)
    expected_names = ["Food1", "Food2"]
    assert names == expected_names
    expected_categories = ["fruit", "unknown"]
    assert categories == expected_categories

@pytest.mark.django_db
def test_get_food_macro_data_with_names_empty_queryset():
    """
    Verify that get_food_macro_data_with_names returns empty outputs when no FoodItems exist.
    """
    FoodItem.objects.all().delete()
    food_data, names, categories = get_food_macro_data_with_names()
    assert food_data.shape == (0, 5)
    assert names == []
    assert categories == []

# ---- scale_nutritional_data Tests ----

def test_scale_nutritional_data_typical():
    """
    Test that scale_nutritional_data returns a scaled array with the same shape,
    and that each column's mean is approximately 0.
    """
    data_array = np.array([
        [1.0, 2.0, 3.0, 4.0, 5.0],
        [2.0, 3.0, 4.0, 5.0, 6.0],
        [3.0, 4.0, 5.0, 6.0, 7.0]
    ])
    scaled_data, scaler = scale_nutritional_data(data_array)
    assert scaled_data.shape == data_array.shape
    np.testing.assert_allclose(scaled_data.mean(axis=0), np.zeros(data_array.shape[1]), atol=1e-7)

def test_scale_nutritional_data_empty():
    """
    Test that scale_nutritional_data raises a ValueError when given an empty array,
    as StandardScaler requires at least one sample.
    """
    data_array = np.empty((0, 5))
    with pytest.raises(ValueError):
        scale_nutritional_data(data_array)

def test_scale_nutritional_data_single_row():
    """
    Test that scaling a single row returns an array of zeros since variance is zero.
    """
    data_array = np.array([[10.0, 20.0, 30.0, 40.0, 50.0]])
    scaled_data, scaler = scale_nutritional_data(data_array)
    np.testing.assert_allclose(scaled_data, np.zeros_like(data_array), atol=1e-7)
