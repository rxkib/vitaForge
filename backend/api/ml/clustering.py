# backend/api/ml/clustering.py

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from api.ml.data_preprocessing import get_food_macro_data, scale_nutritional_data

def perform_macro_clustering(food_ids=None, n_clusters=3):
    """
    Performs KMeans clustering on the scaled macro nutritional data.
    
    Args:
      food_ids (list or None): If provided, only the foods with these IDs are used.
      n_clusters (int): Number of clusters to form.
      
    Returns:
      A tuple (cluster_labels, kmeans_model) where:
        - cluster_labels is a NumPy array of cluster indices.
        - kmeans_model is the fitted KMeans instance.
    """
    # Get macro data: columns [protein, fat, carbs]
    data_array = get_food_macro_data(food_ids)
    scaled_data, scaler = scale_nutritional_data(data_array)
    
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(scaled_data)
    
    return cluster_labels, kmeans

def get_representative_indices(cluster_labels, n_clusters):
    """
    Selects one representative index per cluster (currently, the first occurrence).
    
    Args:
      cluster_labels (np.ndarray): Cluster labels for each food item.
      n_clusters (int): Total number of clusters.
      
    Returns:
      representative_indices (list): List of indices representing each cluster.
    """
    representative_indices = []
    for cluster in range(n_clusters):
        indices = np.where(cluster_labels == cluster)[0]
        if len(indices) > 0:
            representative_indices.append(indices[0])
    return representative_indices

# Alias for backward compatibility
cluster_foods = perform_macro_clustering

if __name__ == '__main__':
    # Example usage: replace with actual food_ids or leave as None for all items.
    food_ids = None
    n_clusters = 3
    labels, model = perform_macro_clustering(food_ids=food_ids, n_clusters=n_clusters)
    print("Cluster Labels:")
    print(labels)
    print("Cluster Centers (in scaled macro space):")
    print(model.cluster_centers_)
    
    rep_indices = get_representative_indices(labels, n_clusters)
    print("Representative Indices for each cluster:")
    print(rep_indices)
