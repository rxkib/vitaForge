# clustering.py

import numpy as np
from sklearn.cluster import KMeans
from api.ml.data_preprocessing import scale_nutritional_data, get_food_macro_data_with_names


def perform_macro_clustering(food_ids=None, n_clusters=3):
    """
    Performs KMeans clustering on the scaled continuous macro nutritional data.
    """
    # Get continuous macro data from the data_preprocessing module.
    food_data, food_names, categories = get_food_macro_data_with_names(food_ids)
    # Extract only the first three columns: [protein, fat, carbs]
    macro_data = food_data[:, :3]
    scaled_data, scaler = scale_nutritional_data(macro_data)
    
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(scaled_data)
    
    return cluster_labels, kmeans

def get_representative_indices(cluster_labels, n_clusters):
    """
    Selects one representative index per cluster (currently, the first occurrence).
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
