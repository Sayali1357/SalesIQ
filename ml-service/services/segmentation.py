import os
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data'))

def run_rfm_segmentation(n_clusters=4):
    seg_csv_path = os.path.join(DATA_DIR, 'customer_segments.csv')
    ecom_csv_path = os.path.join(DATA_DIR, 'ecommerce_sales.csv')

    if os.path.exists(seg_csv_path):
        df_rfm = pd.read_csv(seg_csv_path)
    elif os.path.exists(ecom_csv_path):
        df_ecom = pd.read_csv(ecom_csv_path)
        df_ecom['order_date'] = pd.to_datetime(df_ecom['order_date'])
        max_date = df_ecom['order_date'].max()
        
        rfm = df_ecom.groupby('customer_id').agg({
            'order_date': lambda x: (max_date - x.max()).days,
            'order_id': 'nunique',
            'total_amount': 'sum'
        }).reset_index()

        rfm.columns = ['customer_id', 'Recency', 'Frequency', 'Monetary']
        df_rfm = rfm
    else:
        # Fallback synthetic RFM data
        np.random.seed(42)
        customers = [f"CUST_{1000 + i}" for i in range(500)]
        recency = np.random.randint(1, 365, size=500)
        frequency = np.random.randint(1, 25, size=500)
        monetary = np.random.uniform(500, 25000, size=500)
        df_rfm = pd.DataFrame({
            'customer_id': customers,
            'Recency': recency,
            'Frequency': frequency,
            'Monetary': monetary
        })

    # Standardize RFM features
    rfm_features = df_rfm[['Recency', 'Frequency', 'Monetary']]
    scaler = StandardScaler()
    rfm_scaled = scaler.fit_transform(rfm_features)

    # K-Means Clustering
    n_clusters = max(2, min(n_clusters, 6))
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(rfm_scaled)
    df_rfm['Cluster'] = cluster_labels

    # PCA 2D Dimensionality Reduction
    pca = PCA(n_components=2)
    pca_coords = pca.fit_transform(rfm_scaled)
    df_rfm['PCA1'] = np.round(pca_coords[:, 0], 3)
    df_rfm['PCA2'] = np.round(pca_coords[:, 1], 3)

    # Analyze Cluster Centroids & assign dynamic business labels
    cluster_stats = df_rfm.groupby('Cluster').agg({
        'Recency': 'mean',
        'Frequency': 'mean',
        'Monetary': 'mean',
        'customer_id': 'count'
    }).rename(columns={'customer_id': 'count'}).reset_index()

    # Rank clusters by monetary / frequency score and recency
    # Lower recency is better; higher frequency/monetary is better
    cluster_stats['score'] = (
        (1 / (cluster_stats['Recency'] + 1)) * 0.4 +
        (cluster_stats['Frequency'] / cluster_stats['Frequency'].max()) * 0.3 +
        (cluster_stats['Monetary'] / cluster_stats['Monetary'].max()) * 0.3
    )

    sorted_clusters = cluster_stats.sort_values('score', ascending=False)['Cluster'].tolist()

    label_pool = ['Champions', 'Loyal Customers', 'Potential Loyalists', 'At Risk', 'Lost Customers', 'Need Attention']
    
    cluster_label_map = {}
    for idx, c_id in enumerate(sorted_clusters):
        cluster_label_map[c_id] = label_pool[min(idx, len(label_pool) - 1)]

    df_rfm['segment'] = df_rfm['Cluster'].map(cluster_label_map)

    # Segment Summary Cards
    segment_cards = []
    colors = {
        'Champions': '#8b5cf6',       # Purple
        'Loyal Customers': '#06b6d4', # Cyan
        'Potential Loyalists': '#10b981', # Green
        'At Risk': '#f59e0b',        # Amber/Yellow
        'Lost Customers': '#ef4444',   # Red
        'Need Attention': '#6366f1'   # Indigo
    }

    for _, row in cluster_stats.iterrows():
        c_id = int(row['Cluster'])
        seg_name = cluster_label_map[c_id]
        segment_cards.append({
            'clusterId': c_id,
            'segmentName': seg_name,
            'customerCount': int(row['count']),
            'avgRecency': round(float(row['Recency']), 1),
            'avgFrequency': round(float(row['Frequency']), 1),
            'avgMonetary': round(float(row['Monetary']), 2),
            'color': colors.get(seg_name, '#3b82f6')
        })

    # PCA Points formatting
    pca_points = []
    for _, row in df_rfm.iterrows():
        pca_points.append({
            'customerId': str(row['customer_id']),
            'pca1': float(row['PCA1']),
            'pca2': float(row['PCA2']),
            'segment': str(row['segment']),
            'cluster': int(row['Cluster']),
            'recency': int(row['Recency']),
            'frequency': int(row['Frequency']),
            'monetary': round(float(row['Monetary']), 2)
        })

    # Customer Table Records
    customer_list = []
    for _, row in df_rfm.iterrows():
        customer_list.append({
            'customerId': str(row['customer_id']),
            'recency': int(row['Recency']),
            'frequency': int(row['Frequency']),
            'monetary': round(float(row['Monetary']), 2),
            'cluster': int(row['Cluster']),
            'segment': str(row['segment'])
        })

    total_customers = len(df_rfm)

    return {
        'totalCustomers': total_customers,
        'nClusters': n_clusters,
        'segmentsSummary': segment_cards,
        'pcaPoints': pca_points,
        'customers': customer_list
    }


def retrain_segmentation():
    """Re-run segmentation on latest data files."""
    try:
        result = run_rfm_segmentation(n_clusters=4)
        return {
            'status': 'success',
            'totalCustomers': result['totalCustomers'],
            'nClusters': result['nClusters'],
            'segments': len(result['segmentsSummary'])
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }
