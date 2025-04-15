import numpy as np
import random
import pytest
from api.ml.ga_optimizer import (
    fitness_function,
    create_individual,
    crossover,
    mutate,
    genetic_algorithm_meal_plan
)

# -------------------------------
# fitness_function Tests
# -------------------------------
def test_fitness_function():
    """
    Test fitness_function with a simple candidate solution.
    This test verifies that the function returns a finite, non-negative penalty.
    """
    # Define a dummy nutrient_data array with shape (3, 5).
    nutrient_data = np.array([
        [0.1, 0.05, 0.2, 1.1, 0.02],
        [0.0, 0.0, 0.3, 1.1, 0.0],
        [0.2, 0.1, 0.25, 1.2, 0.03],
    ])
    daily_targets = {
        "calories": 2.0,
        "protein": 0.2,
        "fat": 0.1,
        "carbs": 0.5,
        "fiber": 0.05,
    }
    # A candidate solution: an array of portions.
    solution = np.array([50, 50, 50])
    min_foods = 2
    min_portion = 20
    # No recommended max provided.
    penalty = fitness_function(solution, nutrient_data, daily_targets, min_foods, min_portion)
    assert isinstance(penalty, float)
    assert penalty >= 0.0
    assert np.isfinite(penalty)

# -------------------------------
# create_individual Tests
# -------------------------------
def test_create_individual():
    """
    Test that create_individual returns an array of the correct shape and that each value is within bounds.
    """
    n_items = 5
    min_portion = 20
    max_portion = 500
    individual = create_individual(n_items, min_portion, max_portion)
    assert isinstance(individual, np.ndarray)
    assert individual.shape[0] == n_items
    assert np.all(individual >= min_portion)
    assert np.all(individual <= max_portion)

# -------------------------------
# crossover Tests
# -------------------------------
def test_crossover():
    """
    Test that the crossover function produces a child whose values come from either parent.
    """
    parent1 = np.array([1, 2, 3, 4, 5])
    parent2 = np.array([5, 4, 3, 2, 1])
    child = crossover(parent1, parent2)
    assert child.shape == parent1.shape
    for i in range(len(child)):
        assert child[i] == parent1[i] or child[i] == parent2[i]

# -------------------------------
# mutate Tests
# -------------------------------
def test_mutate_no_mutation_when_rate_zero():
    """
    Test that mutate returns an unchanged individual when mutation rate is zero.
    """
    individual = np.array([50, 50, 50, 50, 50])
    mutated = mutate(np.copy(individual), 20, 500, mutation_rate=0.0)
    np.testing.assert_array_equal(individual, mutated)

def test_mutate_forced_mutation(monkeypatch):
    """
    Test mutate function by forcing mutation on every gene.
    This is achieved by monkey-patching random.random and random.uniform.
    """
    # Save original functions.
    original_random = random.random
    original_uniform = random.uniform
    try:
        # Force mutation: Make random.random always return 0.0.
        monkeypatch.setattr(random, 'random', lambda: 0.0)
        # Force random.uniform to return a fixed value, say 100.
        monkeypatch.setattr(random, 'uniform', lambda a, b: 100.0)
        individual = np.array([50, 50, 50])
        mutated = mutate(np.copy(individual), 20, 500, mutation_rate=1.0)
        # Since our monkey-patched random.random always returns 0.0,
        # each gene will mutate and choose the branch that calls random.uniform,
        # so every gene becomes 100.
        np.testing.assert_array_equal(mutated, np.array([100, 100, 100]))
    finally:
        # Restore original functions (monkeypatch does this automatically, but for clarity).
        monkeypatch.undo()

# -------------------------------
# genetic_algorithm_meal_plan Tests
# -------------------------------
def test_genetic_algorithm_meal_plan():
    """
    Test that genetic_algorithm_meal_plan returns a solution vector with the expected length and a finite fitness.
    Uses a small nutrient_data array and dummy daily_targets.
    """
    # Create a dummy nutrient_data array with shape (3, 5).
    nutrient_data = np.array([
        [0.04, 0.01, 0.70, 3.6, 0.03],
        [0.10, 0.02, 0.60, 3.2, 0.02],
        [0.36, 0.20, 0.30, 5.0, 0.05],
    ])
    daily_targets = {
        "calories": 650,
        "protein": 80,
        "fat": 15,
        "carbs": 50,
        "fiber": 30,
    }
    # For testing, set a recommended max; note that length must match number of items.
    recommended_max = np.array([100, 100, 100])
    
    best_solution, best_fitness = genetic_algorithm_meal_plan(
        nutrient_data, daily_targets,
        min_portion=20, max_portion=500, min_foods=2,
        population_size=10, generations=10,
        recommended_max=recommended_max
    )
    # Check that best_solution is a numpy array of the correct length.
    assert isinstance(best_solution, np.ndarray)
    assert best_solution.shape[0] == nutrient_data.shape[0]
    # best_fitness should be a finite float.
    assert isinstance(best_fitness, float)
    assert np.isfinite(best_fitness)
