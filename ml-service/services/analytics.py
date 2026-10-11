import os
import io
import shutil
import json
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data'))
BACKUP_DIR = os.path.join(DATA_DIR, 'backups')

DATASET_SCHEMAS = {
    'ecommerce_sales': [
        'order_id', 'customer_id', 'product_id', 'category', 'price',
        'discount', 'quantity', 'payment_method', 'order_date',
        'delivery_time_days', 'region', 'returned', 'total_amount',
        'shipping_cost', 'profit_margin', 'customer_age', 'customer_gender'
    ],
    'daily_sales_features': [
        'date', 'daily_sales', 'day_of_week', 'day', 'month', 'is_weekend',
        'lag_1', 'lag_7', 'lag_14', 'lag_28', 'rolling_mean_7',
        'rolling_mean_14', 'rolling_std_7'
    ],
    'customer_segments': [
        'customer_id', 'Recency', 'Frequency', 'Monetary'
    ]
}

DATASET_META = {
    'ecommerce_sales': {
        'displayName': 'E-Commerce Sales Data',
        'description': 'Core transactional data: orders, products, customers, regions. Powers Dashboard, Recommendations, and Inventory.'
    },
    'daily_sales_features': {
        'displayName': 'Daily Sales Features (Forecasting)',
        'description': 'Aggregated daily revenue with lag & rolling features. Powers Sales Forecasting models.'
    },
    'customer_segments': {
        'displayName': 'Customer Segments (RFM)',
        'description': 'Customer RFM (Recency, Frequency, Monetary) data. Powers Customer Segmentation.'
    }
}

# In-memory store for alert resolutions
ALERTS_STORE: List[Dict[str, Any]] = []

def ensure_backup_dir():
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR, exist_ok=True)

def list_datasets() -> List[Dict[str, Any]]:
    datasets = []
    for name, schema in DATASET_SCHEMAS.items():
        file_path = os.path.join(DATA_DIR, f"{name}.csv")
        file_exists = os.path.exists(file_path)
        file_size = 0
        row_count = 0
        columns = schema
        last_modified = None

        if file_exists:
            try:
                stats = os.stat(file_path)
                file_size = stats.st_size
                last_modified = datetime.fromtimestamp(stats.st_mtime).isoformat()
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    # Count rows without loading entire file in memory
                    line_count = sum(1 for _ in f) - 1
                    row_count = max(0, line_count)
                
                # Read columns
                df_sample = pd.read_csv(file_path, nrows=1)
                columns = df_sample.columns.tolist()
            except Exception as e:
                print(f"[Analytics] Error reading {name}.csv info: {e}")

        meta = DATASET_META.get(name, {})
        datasets.append({
            'name': name,
            'displayName': meta.get('displayName', name),
            'description': meta.get('description', ''),
            'fileExists': file_exists,
            'fileSize': file_size,
            'rowCount': row_count,
            'columns': columns,
            'requiredColumns': schema,
            'lastModified': last_modified,
            'status': 'active' if file_exists else 'missing'
        })
    return datasets

def preview_dataset(dataset_name: str, max_rows: int = 10) -> Dict[str, Any]:
    file_path = os.path.join(DATA_DIR, f"{dataset_name}.csv")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset {dataset_name}.csv does not exist.")
    
    df = pd.read_csv(file_path, nrows=max_rows)
    # Total row count
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        total_rows = max(0, sum(1 for _ in f) - 1)

    return {
        'name': dataset_name,
        'totalRows': total_rows,
        'columns': df.columns.tolist(),
        'preview': df.replace({np.nan: None}).to_dict(orient='records')
    }

def delete_dataset(dataset_name: str) -> Dict[str, Any]:
    file_path = os.path.join(DATA_DIR, f"{dataset_name}.csv")
    if os.path.exists(file_path):
        ensure_backup_dir()
        backup_path = os.path.join(BACKUP_DIR, f"{dataset_name}_deleted_{int(datetime.now().timestamp())}.csv")
        shutil.copyfile(file_path, backup_path)
        os.remove(file_path)
        return {
            'status': 'success',
            'message': f"Dataset {dataset_name} deleted and backed up to {os.path.basename(backup_path)}"
        }
    return {'status': 'not_found', 'message': f"Dataset {dataset_name} not found"}

def save_uploaded_csv(dataset_type: str, file_contents: bytes, filename: str) -> Dict[str, Any]:
    if dataset_type not in DATASET_SCHEMAS:
        raise ValueError(f"Invalid datasetType: {dataset_type}. Must be one of: {list(DATASET_SCHEMAS.keys())}")

    # Validate CSV parseable
    try:
        df = pd.read_csv(io.BytesIO(file_contents))
    except Exception as e:
        raise ValueError(f"Failed to parse CSV file: {str(e)}")

    required_cols = DATASET_SCHEMAS[dataset_type]
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(f"CSV missing required columns: {', '.join(missing_cols)}")

    row_count = len(df)
    if row_count == 0:
        raise ValueError("CSV contains no data rows.")

    target_path = os.path.join(DATA_DIR, f"{dataset_type}.csv")

    # Backup existing file
    ensure_backup_dir()
    if os.path.exists(target_path):
        backup_path = os.path.join(BACKUP_DIR, f"{dataset_type}_backup_{int(datetime.now().timestamp())}.csv")
        shutil.copyfile(target_path, backup_path)

    # Save new file directly into dataset
    df.to_csv(target_path, index=False)

    return {
        'rowCount': row_count,
        'columns': df.columns.tolist(),
        'fileSize': os.path.getsize(target_path),
        'preview': df.head(3).replace({np.nan: None}).to_dict(orient='records')
    }

def add_rows_to_dataset(dataset_type: str, rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    if dataset_type not in DATASET_SCHEMAS:
        raise ValueError(f"Invalid datasetType: {dataset_type}")

    if not rows or not isinstance(rows, list):
        raise ValueError("Rows must be a non-empty list of objects")

    target_path = os.path.join(DATA_DIR, f"{dataset_type}.csv")
    new_df = pd.DataFrame(rows)

    if os.path.exists(target_path):
        existing_df = pd.read_csv(target_path)
        combined_df = pd.concat([existing_df, new_df], ignore_index=True)
    else:
        combined_df = new_df

    combined_df.to_csv(target_path, index=False)

    return {
        'rowsAdded': len(rows),
        'totalRows': len(combined_df),
        'columns': combined_df.columns.tolist()
    }

# ----------------- Analytics Calculations -----------------

def parse_days_from_period(period_str: Optional[str]) -> int:
    if not period_str:
        return 30
    import re
    match = re.search(r'\d+', str(period_str))
    return int(match.group()) if match else 30

def load_ecommerce_data() -> pd.DataFrame:
    file_path = os.path.join(DATA_DIR, 'ecommerce_sales.csv')
    if not os.path.exists(file_path):
        return pd.DataFrame()
    df = pd.read_csv(file_path)
    if 'order_date' in df.columns:
        df['order_date'] = pd.to_datetime(df['order_date'])
    return df

def get_dashboard_overview(period_str: str = "30 days") -> Dict[str, Any]:
    days = parse_days_from_period(period_str)
    df = load_ecommerce_data()
    if df.empty:
        return {
            'period': f"{days} days",
            'days': days,
            'totalRevenue': 0,
            'revenueGrowth': 0,
            'totalOrders': 0,
            'ordersGrowth': 0,
            'totalCustomers': 0,
            'customersGrowth': 0,
            'avgOrderValue': 0,
            'aovGrowth': 0
        }

    # Filter out returned orders if returned column exists
    if 'returned' in df.columns:
        active_df = df[df['returned'].astype(str).str.lower().isin(['0', 'false', 'no'])]
    else:
        active_df = df

    max_date = active_df['order_date'].max()
    start_date = max_date - timedelta(days=days)
    prev_start_date = start_date - timedelta(days=days)

    curr = active_df[(active_df['order_date'] >= start_date) & (active_df['order_date'] <= max_date)]
    prev = active_df[(active_df['order_date'] >= prev_start_date) & (active_df['order_date'] < start_date)]

    total_revenue = float(curr['total_amount'].sum())
    total_orders = int(curr['order_id'].nunique())
    total_customers = int(curr['customer_id'].nunique())
    avg_order_value = round(total_revenue / total_orders, 2) if total_orders > 0 else 0.0

    prev_revenue = float(prev['total_amount'].sum())
    prev_orders = int(prev['order_id'].nunique())
    prev_customers = int(prev['customer_id'].nunique())
    prev_aov = round(prev_revenue / prev_orders, 2) if prev_orders > 0 else 0.0

    def calc_growth(c, p):
        if p > 0:
            return round(((c - p) / p) * 100, 1)
        return 100.0 if c > 0 else 0.0

    return {
        'period': f"{days} days",
        'days': days,
        'totalRevenue': round(total_revenue, 2),
        'revenueGrowth': calc_growth(total_revenue, prev_revenue),
        'totalOrders': total_orders,
        'ordersGrowth': calc_growth(total_orders, prev_orders),
        'totalCustomers': total_customers,
        'customersGrowth': calc_growth(total_customers, prev_customers),
        'avgOrderValue': round(avg_order_value, 2),
        'aovGrowth': calc_growth(avg_order_value, prev_aov)
    }

def get_revenue_trend(period_str: str = "30 days") -> List[Dict[str, Any]]:
    days = parse_days_from_period(period_str)
    df = load_ecommerce_data()
    if df.empty:
        return []

    if 'returned' in df.columns:
        active_df = df[df['returned'].astype(str).str.lower().isin(['0', 'false', 'no'])]
    else:
        active_df = df

    max_date = active_df['order_date'].max()
    start_date = max_date - timedelta(days=days)
    filtered = active_df[(active_df['order_date'] >= start_date) & (active_df['order_date'] <= max_date)].copy()

    # Aggregate by date
    filtered['date_str'] = filtered['order_date'].dt.strftime('%Y-%m-%d')
    daily = filtered.groupby('date_str').agg({
        'total_amount': 'sum',
        'order_id': 'nunique'
    }).reset_index().rename(columns={'total_amount': 'revenue', 'order_id': 'orders'})

    daily = daily.sort_values('date_str')
    daily['movingAverage'] = daily['revenue'].rolling(window=7, min_periods=1).mean().round(2)

    result = []
    for _, row in daily.iterrows():
        result.append({
            'date': row['date_str'],
            'revenue': round(float(row['revenue']), 2),
            'orders': int(row['orders']),
            'movingAverage': round(float(row['movingAverage']), 2)
        })
    return result

def get_categories_breakdown(period_str: str = "30 days") -> List[Dict[str, Any]]:
    days = parse_days_from_period(period_str)
    df = load_ecommerce_data()
    if df.empty:
        return []

    if 'returned' in df.columns:
        active_df = df[df['returned'].astype(str).str.lower().isin(['0', 'false', 'no'])]
    else:
        active_df = df

    max_date = active_df['order_date'].max()
    start_date = max_date - timedelta(days=days)
    filtered = active_df[(active_df['order_date'] >= start_date) & (active_df['order_date'] <= max_date)]

    cat_grouped = filtered.groupby('category').agg({
        'total_amount': 'sum',
        'quantity': 'sum',
        'order_id': 'nunique'
    }).reset_index()

    total_rev = cat_grouped['total_amount'].sum()
    cat_grouped = cat_grouped.sort_values('total_amount', ascending=False)

    result = []
    for _, row in cat_grouped.iterrows():
        rev = float(row['total_amount'])
        pct = round((rev / total_rev) * 100, 1) if total_rev > 0 else 0
        result.append({
            'category': str(row['category']),
            'revenue': round(rev, 2),
            'units': int(row['quantity']),
            'percentage': pct
        })
    return result

def get_regions_breakdown(period_str: str = "30 days") -> List[Dict[str, Any]]:
    days = parse_days_from_period(period_str)
    df = load_ecommerce_data()
    if df.empty:
        return []

    if 'returned' in df.columns:
        active_df = df[df['returned'].astype(str).str.lower().isin(['0', 'false', 'no'])]
    else:
        active_df = df

    max_date = active_df['order_date'].max()
    start_date = max_date - timedelta(days=days)
    filtered = active_df[(active_df['order_date'] >= start_date) & (active_df['order_date'] <= max_date)]

    reg_grouped = filtered.groupby('region').agg({
        'total_amount': 'sum',
        'order_id': 'nunique'
    }).reset_index().sort_values('total_amount', ascending=False)

    result = []
    for _, row in reg_grouped.iterrows():
        result.append({
            'region': str(row['region']),
            'revenue': round(float(row['total_amount']), 2),
            'orders': int(row['order_id'])
        })
    return result

def get_channels_breakdown(period_str: str = "30 days") -> List[Dict[str, Any]]:
    days = parse_days_from_period(period_str)
    df = load_ecommerce_data()
    if df.empty:
        return []

    if 'returned' in df.columns:
        active_df = df[df['returned'].astype(str).str.lower().isin(['0', 'false', 'no'])]
    else:
        active_df = df

    max_date = active_df['order_date'].max()
    start_date = max_date - timedelta(days=days)
    filtered = active_df[(active_df['order_date'] >= start_date) & (active_df['order_date'] <= max_date)]

    chan_col = 'payment_method' if 'payment_method' in filtered.columns else 'region'
    grouped = filtered.groupby(chan_col).agg({
        'total_amount': 'sum'
    }).reset_index().sort_values('total_amount', ascending=False)

    total_rev = grouped['total_amount'].sum()
    result = []
    for _, row in grouped.iterrows():
        rev = float(row['total_amount'])
        pct = round((rev / total_rev) * 100, 1) if total_rev > 0 else 0
        result.append({
            'channel': str(row[chan_col]),
            'revenue': round(rev, 2),
            'percentage': pct
        })
    return result

def get_top_products(period_str: str = "30 days", top_n: int = 5) -> List[Dict[str, Any]]:
    days = parse_days_from_period(period_str)
    df = load_ecommerce_data()
    if df.empty:
        return []

    if 'returned' in df.columns:
        active_df = df[df['returned'].astype(str).str.lower().isin(['0', 'false', 'no'])]
    else:
        active_df = df

    max_date = active_df['order_date'].max()
    start_date = max_date - timedelta(days=days)
    filtered = active_df[(active_df['order_date'] >= start_date) & (active_df['order_date'] <= max_date)]

    prod_grouped = filtered.groupby('product_id').agg({
        'category': 'first',
        'quantity': 'sum',
        'total_amount': 'sum',
        'price': 'mean'
    }).reset_index().sort_values('total_amount', ascending=False).head(top_n)

    result = []
    for rank, (_, row) in enumerate(prod_grouped.iterrows(), 1):
        result.append({
            'rank': rank,
            'productId': str(row['product_id']),
            'productName': f"Product {row['product_id']}",
            'category': str(row['category']),
            'unitsSold': int(row['quantity']),
            'revenue': round(float(row['total_amount']), 2),
            'avgPrice': round(float(row['price']), 2)
        })
    return result

def get_available_products() -> List[Dict[str, Any]]:
    df = load_ecommerce_data()
    if df.empty:
        return []
    unique_prods = df.groupby('product_id').agg({
        'category': 'first',
        'price': 'mean'
    }).reset_index().head(25)

    result = []
    for _, row in unique_prods.iterrows():
        result.append({
            'id': str(row['product_id']),
            'name': f"Product {row['product_id']}",
            'category': str(row['category']),
            'price': round(float(row['price']), 2)
        })
    return result

# ----------------- Real-Time Alerts -----------------

def generate_inventory_alerts(inventory_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    global ALERTS_STORE
    existing_ids = {a['id'] for a in ALERTS_STORE}
    new_alerts = []

    for item in inventory_items:
        current_stock = item.get('currentStock', 0)
        reorder_level = item.get('reorderLevel', 15)
        pid = item.get('productId')
        pname = item.get('productName', f"Product {pid}")

        if current_stock == 0:
            alert_id = f"out_of_stock_{pid}"
            if alert_id not in existing_ids:
                alert = {
                    'id': alert_id,
                    '_id': alert_id,
                    'alertType': 'Out of Stock',
                    'title': f"Out of Stock: {pname}",
                    'message': f"Product {pid} stock reached 0 units. Immediate inventory replenishment required!",
                    'severity': 'Critical',
                    'resolved': False,
                    'createdAt': datetime.now().isoformat()
                }
                ALERTS_STORE.insert(0, alert)
                new_alerts.append(alert)
        elif current_stock < reorder_level:
            alert_id = f"low_stock_{pid}"
            if alert_id not in existing_ids:
                alert = {
                    'id': alert_id,
                    '_id': alert_id,
                    'alertType': 'Low Stock',
                    'title': f"Low Stock Warning: {pname}",
                    'message': f"Product {pid} stock ({current_stock}) is below reorder level ({reorder_level}).",
                    'severity': 'Warning',
                    'resolved': False,
                    'createdAt': datetime.now().isoformat()
                }
                ALERTS_STORE.insert(0, alert)
                new_alerts.append(alert)

    return new_alerts

def get_alerts_data(severity: Optional[str] = None, resolved: Optional[bool] = None) -> Dict[str, Any]:
    global ALERTS_STORE
    filtered = ALERTS_STORE
    if severity:
        filtered = [a for a in filtered if a.get('severity') == severity]
    if resolved is not None:
        filtered = [a for a in filtered if a.get('resolved') == resolved]

    critical = len([a for a in ALERTS_STORE if a.get('severity') == 'Critical' and not a.get('resolved')])
    warning = len([a for a in ALERTS_STORE if a.get('severity') == 'Warning' and not a.get('resolved')])
    info = len([a for a in ALERTS_STORE if a.get('severity') == 'Info' and not a.get('resolved')])
    res_count = len([a for a in ALERTS_STORE if a.get('resolved')])

    return {
        'summary': {
            'totalAlerts': len(ALERTS_STORE),
            'critical': critical,
            'warning': warning,
            'info': info,
            'resolved': res_count
        },
        'alerts': filtered
    }

def resolve_alert_by_id(alert_id: str) -> bool:
    global ALERTS_STORE
    for a in ALERTS_STORE:
        if a.get('id') == alert_id or a.get('_id') == alert_id:
            a['resolved'] = True
            return True
    return False

def delete_alert_by_id(alert_id: str) -> bool:
    global ALERTS_STORE
    initial_len = len(ALERTS_STORE)
    ALERTS_STORE = [a for a in ALERTS_STORE if a.get('id') != alert_id and a.get('_id') != alert_id]
    return len(ALERTS_STORE) < initial_len
