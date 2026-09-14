import os
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data'))

def get_product_recommendations(product_id=None, top_n=5):
    ecom_csv_path = os.path.join(DATA_DIR, 'ecommerce_sales.csv')
    
    if os.path.exists(ecom_csv_path):
        df = pd.read_csv(ecom_csv_path)
    else:
        # Synthetic matrix fallback
        np.random.seed(42)
        customers = [f"CUST_{i}" for i in range(100)]
        products = [f"PROD_{i:03d}" for i in range(1, 30)]
        categories = ['Electronics', 'Clothing', 'Grocery', 'Furniture', 'Beauty', 'Sports', 'Books', 'Home Appliances']
        
        data = []
        for _ in range(1000):
            data.append({
                'customer_id': np.random.choice(customers),
                'product_id': np.random.choice(products),
                'category': np.random.choice(categories),
                'price': np.random.uniform(500, 50000),
                'quantity': np.random.randint(1, 5)
            })
        df = pd.DataFrame(data)

    # Product catalog metadata
    product_meta = df.groupby('product_id').agg({
        'category': 'first',
        'price': 'mean'
    }).reset_index()

    # Build Customer-Product interaction matrix
    user_item_matrix = df.pivot_table(index='customer_id', columns='product_id', values='quantity', aggfunc='sum', fill_value=0)

    if user_item_matrix.shape[1] < 2:
        return {'product_id': product_id, 'recommendations': []}

    # Cosine Similarity Matrix between items (transpose of user-item matrix)
    item_similarity = cosine_similarity(user_item_matrix.T)
    item_sim_df = pd.DataFrame(item_similarity, index=user_item_matrix.columns, columns=user_item_matrix.columns)

    if not product_id or product_id not in item_sim_df.index:
        product_id = item_sim_df.index[0]

    sim_scores = item_sim_df[product_id].drop(index=product_id).sort_values(ascending=False).head(top_n)

    recommendations = []
    for target_pid, score in sim_scores.items():
        meta = product_meta[product_meta['product_id'] == target_pid]
        category = meta['category'].iloc[0] if len(meta) > 0 else 'General'
        price = float(meta['price'].iloc[0]) if len(meta) > 0 else 1000.0

        recommendations.append({
            'productId': str(target_pid),
            'productName': f"Product {target_pid}",
            'category': str(category),
            'price': round(price, 2),
            'similarityScore': round(float(score), 4),
            'matchPercentage': round(float(score) * 100, 1)
        })

    target_meta = product_meta[product_meta['product_id'] == product_id]
    target_category = target_meta['category'].iloc[0] if len(target_meta) > 0 else 'General'
    target_price = float(target_meta['price'].iloc[0]) if len(target_meta) > 0 else 1000.0

    return {
        'selectedProduct': {
            'productId': str(product_id),
            'productName': f"Product {product_id}",
            'category': str(target_category),
            'price': round(target_price, 2)
        },
        'recommendations': recommendations
    }


def retrain_recommendations():
    """Re-build the recommendation similarity matrix from latest data."""
    try:
        result = get_product_recommendations()
        return {
            'status': 'success',
            'recommendationCount': len(result.get('recommendations', []))
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }
