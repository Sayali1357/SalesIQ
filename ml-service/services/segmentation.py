import os
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data'))

_SEG_CACHE = {}
_SEG_MTIME = None

def run_rfm_segmentation(n_clusters=4, force_refresh=False):
    global _SEG_CACHE, _SEG_MTIME
    seg_csv_path = os.path.join(DATA_DIR, 'customer_segments.csv')
    ecom_csv_path = os.path.join(DATA_DIR, 'ecommerce_sales.csv')

    target_file = seg_csv_path if os.path.exists(seg_csv_path) else ecom_csv_path
    current_mtime = os.path.getmtime(target_file) if os.path.exists(target_file) else None

    if _SEG_MTIME != current_mtime:
        _SEG_CACHE.clear()
        _SEG_MTIME = current_mtime

    n_clusters = max(2, min(n_clusters, 6))

    if not force_refresh and n_clusters in _SEG_CACHE:
        return _SEG_CACHE[n_clusters]

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

    # K-Means Clustering (n_init=3 is fast and consistent with random_state)
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=3)
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

    # Dynamic Persona Assignment
    persona_pool = ['Champions', 'Loyal Customers', 'Potential Loyalists', 'At Risk', 'Lost Customers', 'Need Attention']
    cluster_score = (
        (cluster_stats['Monetary'] / (cluster_stats['Monetary'].max() or 1)) * 0.45 +
        (cluster_stats['Frequency'] / (cluster_stats['Frequency'].max() or 1)) * 0.35 -
        (cluster_stats['Recency'] / (cluster_stats['Recency'].max() or 1)) * 0.20
    )
    ranked_indices = cluster_score.sort_values(ascending=False).index.tolist()

    cluster_label_map = {}
    for rank_pos, cluster_idx in enumerate(ranked_indices):
        cluster_id = cluster_stats.loc[cluster_idx, 'Cluster']
        cluster_label_map[cluster_id] = persona_pool[min(rank_pos, len(persona_pool) - 1)]

    df_rfm['segment'] = df_rfm['Cluster'].map(cluster_label_map)

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

    # High-speed records serialization
    sample_df = df_rfm.head(400) if len(df_rfm) > 1000 else df_rfm
    pca_points = [
        {
            'customerId': str(r['customer_id']),
            'pca1': float(r['PCA1']),
            'pca2': float(r['PCA2']),
            'segment': str(r['segment']),
            'cluster': int(r['Cluster']),
            'recency': int(r['Recency']),
            'frequency': int(r['Frequency']),
            'monetary': round(float(r['Monetary']), 2)
        }
        for r in sample_df.to_dict('records')
    ]

    customer_list = [
        {
            'customerId': str(r['customer_id']),
            'recency': int(r['Recency']),
            'frequency': int(r['Frequency']),
            'monetary': round(float(r['Monetary']), 2),
            'cluster': int(r['Cluster']),
            'segment': str(r['segment'])
        }
        for r in df_rfm.head(200).to_dict('records')
    ]

    result = {
        'totalCustomers': len(df_rfm),
        'nClusters': n_clusters,
        'segmentsSummary': segment_cards,
        'pcaPoints': pca_points,
        'customers': customer_list
    }

    _SEG_CACHE[n_clusters] = result
    return result


def retrain_segmentation():
    """Re-run segmentation on latest data files."""
    try:
        result = run_rfm_segmentation(n_clusters=4, force_refresh=True)
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
