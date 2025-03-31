import numpy as np
import random

def fitness_function(solution, nutrient_data, daily_targets, min_foods, min_portion, recommended_max=None):
    """
    Computes the fitness (penalty) for a candidate meal plan.
    Lower fitness is better.
    """
    total_protein = np.sum(nutrient_data[:, 0] * solution)
    total_fat = np.sum(nutrient_data[:, 1] * solution)
    total_carbs = np.sum(nutrient_data[:, 2] * solution)
    total_calories = np.sum(nutrient_data[:, 3] * solution)
    total_fiber = np.sum(nutrient_data[:, 4] * solution)
    
    penalty_cal = (total_calories - daily_targets["calories"]) ** 2
    penalty_prot = (total_protein - daily_targets["protein"]) ** 2
    penalty_fat = (total_fat - daily_targets["fat"]) ** 2
    penalty_carb = (total_carbs - daily_targets["carbs"]) ** 2
    penalty_fiber = max(0, daily_targets["fiber"] - total_fiber) ** 2
    
    # Diversity penalty: force at least min_foods foods to be above min_portion.
    selected = solution >= min_portion
    count_selected = np.sum(selected)
    penalty_diversity = 0
    if count_selected < min_foods:
        penalty_diversity = (min_foods - count_selected) * 1e5  # high penalty

    # Weight penalty (optional).
    weight_penalty = np.sum(solution) * 0.01
    
    # NEW: Extra penalty for exceeding recommended max portion.
    penalty_max = 0
    if recommended_max is not None:
        for i, portion in enumerate(solution):
            if portion > recommended_max[i]:
                # For example, square the excess and multiply by a factor.
                penalty_max += ((portion - recommended_max[i]) ** 2)
        penalty_max *= 100.0  # Adjust factor as needed

    total_penalty = (penalty_cal + penalty_prot + penalty_fat +
                     penalty_carb + penalty_fiber +
                     penalty_diversity + weight_penalty + penalty_max)
    return total_penalty

def create_individual(n_items, min_portion, max_portion):
    """
    Creates a candidate solution where every food is assigned a random portion 
    between min_portion and max_portion.
    """
    individual = np.array([random.uniform(min_portion, max_portion) for _ in range(n_items)])
    return individual

def crossover(parent1, parent2):
    """
    Uniform crossover between two individuals.
    """
    n = len(parent1)
    child = np.copy(parent1)
    for i in range(n):
        if random.random() < 0.5:
            child[i] = parent2[i]
    return child

def mutate(individual, min_portion, max_portion, mutation_rate=0.1):
    """
    Mutates an individual by randomly altering some portions.
    """
    n = len(individual)
    for i in range(n):
        if random.random() < mutation_rate:
            if random.random() < 0.5:
                individual[i] = random.uniform(min_portion, max_portion)
            else:
                individual[i] = 0
    return individual

def genetic_algorithm_meal_plan(nutrient_data, daily_targets, min_portion=20, max_portion=500, min_foods=3,
                                  population_size=50, generations=200, recommended_max=None):
    """
    Runs a genetic algorithm to optimize the meal plan.
    
    nutrient_data: array with columns [protein, fat, carbs, cal_per_g, fiber]
    daily_targets: dict with keys "calories", "protein", "fat", "carbs", "fiber"
    recommended_max: array of recommended maximum portion (in grams) for each food.
    Returns the best solution vector and its fitness.
    """
    n_items = nutrient_data.shape[0]
    population = [create_individual(n_items, min_portion, max_portion) for _ in range(population_size)]
    best = None
    best_fitness = float('inf')
    
    for gen in range(generations):
        fitnesses = [fitness_function(ind, nutrient_data, daily_targets, min_foods, min_portion, recommended_max) 
                     for ind in population]
        
        # Track best solution.
        for ind, fit in zip(population, fitnesses):
            if fit < best_fitness:
                best_fitness = fit
                best = np.copy(ind)
        
        # Tournament selection.
        new_population = []
        for _ in range(population_size):
            contenders = random.sample(population, 3)
            contender_fitnesses = [fitness_function(c, nutrient_data, daily_targets, min_foods, min_portion, recommended_max)
                                   for c in contenders]
            winner = contenders[np.argmin(contender_fitnesses)]
            new_population.append(np.copy(winner))
        
        # Crossover.
        next_population = []
        for i in range(0, population_size, 2):
            parent1 = new_population[i]
            parent2 = new_population[(i+1) % population_size]
            child1 = crossover(parent1, parent2)
            child2 = crossover(parent2, parent1)
            next_population.extend([child1, child2])
        
        # Mutation.
        population = [mutate(ind, min_portion, max_portion, mutation_rate=0.1) for ind in next_population]
    
    return best, best_fitness

# Example testing code (remove before deployment)
if __name__ == "__main__":
    nutrient_data = np.array([
        [0.04, 0.01, 0.70, 3.6, 0.03],  # Rolled Oats
        [0.10, 0.02, 0.60, 3.2, 0.02],  # Pasta
        [0.36, 0.20, 0.30, 5.0, 0.05],  # Soya bean
        [0.01, 0.00, 0.17, 0.8, 0.02],  # Grapes
        [0.15, 0.50, 0.30, 6.5, 0.05],  # Cashew nut
        [0.31, 0.04, 0.00, 1.65, 0.00], # Chicken breast
        [0.00, 1.00, 0.00, 9.0, 0.00],  # Soyabean oil
    ])
    daily_targets = {
        "calories": 650,
        "protein": 80,
        "fat": 15,
        "carbs": 50,
        "fiber": 30,
    }
    # For testing, assign recommended_max per food:
    # Let's assume: fruits (e.g., grapes) 200g, grains 300g, protein 250g, oil 150g, etc.
    # Here we simply set a default array for demonstration (length must match nutrient_data rows).
    recommended_max = np.array([300, 300, 300, 200, 250, 250, 150])
    
    best_solution, best_fit = genetic_algorithm_meal_plan(
        nutrient_data, daily_targets,
        min_portion=20, max_portion=500, min_foods=7,
        population_size=50, generations=200,
        recommended_max=recommended_max
    )
    print("Best Solution (portions in grams):", best_solution)
    print("Best Fitness:", best_fit)
