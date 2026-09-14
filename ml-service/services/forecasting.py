import os
import numpy as np
import pandas as pd
import joblib
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data'))
MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'models'))

FEATURE_COLS = ['day_of_week', 'day', 'month', 'is_weekend', 'lag_1', 'lag_7', 'lag_14', 'lag_28', 'rolling_mean_7', 'rolling_mean_14', 'rolling_std_7']

def load_data_and_train_eval():
    csv_path = os.path.join(DATA_DIR, 'daily_sales_features.csv')
    if not os.path.exists(csv_path):
        # Fallback synthetic dataset generator if csv doesn't exist
        dates = pd.date_range(end=pd.Timestamp.now(), periods=365, freq='D')
        np.random.seed(42)
        base_sales = 3000 + np.sin(np.arange(365) * (2 * np.pi / 7)) * 800 + np.random.normal(0, 400, 365)
        df = pd.DataFrame({'date': dates, 'daily_sales': np.clip(base_sales, 500, 10000)})
        df['day_of_week'] = df['date'].dt.dayofweek
        df['day'] = df['date'].dt.day
        df['month'] = df['date'].dt.month
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        df['lag_1'] = df['daily_sales'].shift(1)
        df['lag_7'] = df['daily_sales'].shift(7)
        df['lag_14'] = df['daily_sales'].shift(14)
        df['lag_28'] = df['daily_sales'].shift(28)
        df['rolling_mean_7'] = df['daily_sales'].shift(1).rolling(7).mean()
        df['rolling_mean_14'] = df['daily_sales'].shift(1).rolling(14).mean()
        df['rolling_std_7'] = df['daily_sales'].shift(1).rolling(7).std()
        df = df.dropna().reset_index(drop=True)
    else:
        df = pd.read_csv(csv_path)
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])

    # Ensure all feature columns exist
    df = df.dropna().reset_index(drop=True)
    X = df[FEATURE_COLS]
    y = df['daily_sales']

    # Train / Test split (80/20 time based)
    split_idx = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Ridge Model
    ridge = Ridge(alpha=1.0)
    ridge.fit(X_train_scaled, y_train)
    y_pred_ridge = ridge.predict(X_test_scaled)
    mae_ridge = float(mean_absolute_error(y_test, y_pred_ridge))
    rmse_ridge = float(root_mean_squared_error(y_test, y_pred_ridge))
    r2_ridge = float(r2_score(y_test, y_pred_ridge))

    # Random Forest Model
    rf = RandomForestRegressor(n_estimators=100, random_state=42)
    rf.fit(X_train, y_train)
    y_pred_rf = rf.predict(X_test)
    mae_rf = float(mean_absolute_error(y_test, y_pred_rf))
    rmse_rf = float(root_mean_squared_error(y_test, y_pred_rf))
    r2_rf = float(r2_score(y_test, y_pred_rf))

    # Gradient Boosting Model
    gb = GradientBoostingRegressor(n_estimators=100, random_state=42)
    gb.fit(X_train, y_train)
    y_pred_gb = gb.predict(X_test)
    mae_gb = float(mean_absolute_error(y_test, y_pred_gb))
    rmse_gb = float(root_mean_squared_error(y_test, y_pred_gb))
    r2_gb = float(r2_score(y_test, y_pred_gb))

    models_info = {
        'ridge': {
            'name': 'Ridge Regression',
            'model': ridge,
            'scaler': scaler,
            'requires_scaling': True,
            'mae': round(mae_ridge, 2),
            'rmse': round(rmse_ridge, 2),
            'r2': round(r2_ridge, 4),
            'description': 'Linear regression model with L2 regularization used as baseline forecasting model.'
        },
        'random_forest': {
            'name': 'Random Forest',
            'model': rf,
            'scaler': None,
            'requires_scaling': False,
            'mae': round(mae_rf, 2),
            'rmse': round(rmse_rf, 2),
            'r2': round(r2_rf, 4),
            'description': 'Ensemble tree model that captures non-linear relationships between lag features and sales.'
        },
        'gradient_boosting': {
            'name': 'Gradient Boosting',
            'model': gb,
            'scaler': None,
            'requires_scaling': False,
            'mae': round(mae_gb, 2),
            'rmse': round(rmse_gb, 2),
            'r2': round(r2_gb, 4),
            'description': 'Sequential ensemble model where new trees iteratively correct residual errors.'
        }
    }

    best_key = min(models_info.keys(), key=lambda k: models_info[k]['mae'])
    for k in models_info:
        models_info[k]['is_best'] = (k == best_key)

    return df, models_info

def generate_forecast(model_name="random_forest", forecast_days=30):
    df, models_info = load_data_and_train_eval()
    
    # Map friendly model key
    key = model_name.lower().replace(" ", "_")
    if key not in models_info:
        key = "random_forest"
    
    selected_model_info = models_info[key]
    model = selected_model_info['model']
    scaler = selected_model_info['scaler']
    requires_scaling = selected_model_info['requires_scaling']

    # Historical data formatting (last 60 days)
    df_sorted = df.sort_values('date').reset_index(drop=True)
    recent_df = df_sorted.tail(60).copy()
    
    historical = []
    for _, row in recent_df.iterrows():
        historical.append({
            'date': row['date'].strftime('%Y-%m-%d') if isinstance(row['date'], pd.Timestamp) else str(row['date']),
            'actual_sales': round(float(row['daily_sales']), 2),
            'forecast': None
        })

    # Recursive multi-step forecasting
    last_date = pd.to_datetime(recent_df['date'].iloc[-1])
    recent_sales = list(df_sorted['daily_sales'].values)

    forecast_results = []
    current_date = last_date

    for i in range(1, forecast_days + 1):
        current_date = current_date + pd.Timedelta(days=1)
        dow = current_date.dayofweek
        day = current_date.day
        month = current_date.month
        is_wknd = 1 if dow in [5, 6] else 0

        lag_1 = recent_sales[-1]
        lag_7 = recent_sales[-7] if len(recent_sales) >= 7 else recent_sales[-1]
        lag_14 = recent_sales[-14] if len(recent_sales) >= 14 else recent_sales[-1]
        lag_28 = recent_sales[-28] if len(recent_sales) >= 28 else recent_sales[-1]

        roll_7 = float(np.mean(recent_sales[-7:]))
        roll_14 = float(np.mean(recent_sales[-14:]))
        roll_std_7 = float(np.std(recent_sales[-7:]))

        feat_array = np.array([[dow, day, month, is_wknd, lag_1, lag_7, lag_14, lag_28, roll_7, roll_14, roll_std_7]])

        if requires_scaling and scaler:
            feat_input = scaler.transform(feat_array)
        else:
            feat_input = feat_array

        pred = float(model.predict(feat_input)[0])
        pred = max(pred, 100.0) # Ensure positive realistic sales

        recent_sales.append(pred)

        # Upper/lower confidence bounds
        std_error = selected_model_info['mae'] * 0.8
        lower_bound = max(0, pred - 1.96 * std_error)
        upper_bound = pred + 1.96 * std_error

        forecast_results.append({
            'date': current_date.strftime('%Y-%m-%d'),
            'actual_sales': None,
            'forecast': round(pred, 2),
            'lower_bound': round(lower_bound, 2),
            'upper_bound': round(upper_bound, 2)
        })

    # Feature Importance (if tree-based)
    feature_importance = []
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
        sorted_indices = np.argsort(importances)[::-1]
        for idx in sorted_indices:
            feature_importance.append({
                'feature': FEATURE_COLS[idx],
                'importance': round(float(importances[idx]), 4)
            })
    elif hasattr(model, 'coef_'):
        coefs = np.abs(model.coef_)
        sorted_indices = np.argsort(coefs)[::-1]
        for idx in sorted_indices:
            feature_importance.append({
                'feature': FEATURE_COLS[idx],
                'importance': round(float(coefs[idx]), 4)
            })

    # Summary metric comparison for all models
    model_comparison = []
    for k, info in models_info.items():
        model_comparison.append({
            'modelKey': k,
            'model': info['name'],
            'mae': info['mae'],
            'rmse': info['rmse'],
            'r2': info['r2'],
            'description': info['description'],
            'isBest': info['is_best']
        })

    total_predicted_revenue = round(sum(item['forecast'] for item in forecast_results), 2)
    avg_daily_forecast = round(total_predicted_revenue / forecast_days, 2)

    return {
        'selectedModel': selected_model_info['name'],
        'forecastDays': forecast_days,
        'metrics': {
            'mae': selected_model_info['mae'],
            'rmse': selected_model_info['rmse'],
            'r2': selected_model_info['r2']
        },
        'summary': {
            'totalPredictedRevenue': total_predicted_revenue,
            'avgDailyForecast': avg_daily_forecast
        },
        'historical': historical,
        'forecast': forecast_results,
        'combinedCurve': historical + forecast_results,
        'featureImportance': feature_importance,
        'modelComparison': model_comparison
    }


def retrain_models():
    """Re-train all forecasting models using the latest data from CSV files on disk."""
    try:
        df, models_info = load_data_and_train_eval()
        
        # Save re-trained models to disk
        for key, info in models_info.items():
            model_path = os.path.join(MODELS_DIR, f"{key}_sales_model.pkl")
            try:
                joblib.dump(info['model'], model_path)
            except Exception as e:
                print(f"[Retrain] Warning: Could not save {key} model: {e}")
            
            if info.get('scaler'):
                scaler_path = os.path.join(MODELS_DIR, f"{key}_scaler.pkl")
                try:
                    joblib.dump(info['scaler'], scaler_path)
                except Exception as e:
                    print(f"[Retrain] Warning: Could not save {key} scaler: {e}")
        
        csv_path = os.path.join(DATA_DIR, 'daily_sales_features.csv')
        row_count = len(df)
        
        results = {
            'status': 'success',
            'modelsRetrained': list(models_info.keys()),
            'dataRows': row_count,
            'metrics': {}
        }
        
        for key, info in models_info.items():
            results['metrics'][key] = {
                'name': info['name'],
                'mae': info['mae'],
                'rmse': info['rmse'],
                'r2': info['r2'],
                'isBest': info['is_best']
            }
        
        return results
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }
