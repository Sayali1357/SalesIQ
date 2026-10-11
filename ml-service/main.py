import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

from services.forecasting import generate_forecast, retrain_models
from services.segmentation import run_rfm_segmentation, retrain_segmentation
from services.recommendation import get_product_recommendations, retrain_recommendations
from services.inventory_demand import predict_inventory_demand, retrain_inventory
from services.analytics import (
    list_datasets,
    preview_dataset,
    delete_dataset,
    save_uploaded_csv,
    add_rows_to_dataset,
    get_dashboard_overview,
    get_revenue_trend,
    get_categories_breakdown,
    get_regions_breakdown,
    get_channels_breakdown,
    get_top_products,
    get_available_products,
    generate_inventory_alerts,
    get_alerts_data,
    resolve_alert_by_id,
    delete_alert_by_id,
    DATA_DIR
)

app = FastAPI(
    title="SalesIQ Python ML & Analytics Service",
    description="Machine Learning, Forecasting, Segmentation & Direct Dataset Operations Service for SalesIQ",
    version="2.0.0"
)

# Enable CORS for direct Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Request Models -----------------

class ForecastRequest(BaseModel):
    model: Optional[str] = "random_forest"
    forecastDays: Optional[int] = 30

class SegmentRequest(BaseModel):
    nClusters: Optional[int] = 4

class RecommendRequest(BaseModel):
    productId: Optional[str] = None
    topN: Optional[int] = 5

class InventoryDemandRequest(BaseModel):
    products: Optional[List[dict]] = None

class RetrainRequest(BaseModel):
    datasetType: Optional[str] = "all"

class AddRowsRequest(BaseModel):
    datasetType: str
    rows: List[Dict[str, Any]]

# ----------------- Base Status -----------------

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "SalesIQ Python ML & Analytics Service",
        "version": "2.0.0",
        "connectedDirectlyTo": "Frontend",
        "features": [
            "Forecasting", "Customer RFM Segmentation", "Product Recommendations",
            "Inventory Demand", "Direct Dataset CSV Upload & Row Appends", "Real-time Dashboard Analytics"
        ]
    }

# ----------------- Machine Learning Endpoints -----------------

@app.post("/forecast")
def forecast_endpoint(req: ForecastRequest):
    try:
        results = generate_forecast(model_name=req.model, forecast_days=req.forecastDays)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting Error: {str(e)}")

@app.get("/forecast/models")
def forecast_models_endpoint():
    return [
        {
            'key': 'ridge',
            'name': 'Ridge Regression',
            'type': 'Linear Regularized',
            'description': 'Linear regression baseline with L2 regularization for stable trend forecasting.',
            'features': ['L2 Penalty', 'Fast Inference', 'Baseline Metric']
        },
        {
            'key': 'random_forest',
            'name': 'Random Forest',
            'type': 'Ensemble Bagging',
            'description': 'Ensemble regression capturing non-linear relationships and seasonality across sales lags.',
            'features': ['Feature Importances', 'Non-linear boundaries', 'Outlier Resilience']
        },
        {
            'key': 'gradient_boosting',
            'name': 'Gradient Boosting',
            'type': 'Sequential Boosting',
            'description': 'High-performance sequential tree ensemble iteratively minimizing prediction residuals.',
            'features': ['Iterative Error Reduction', 'High Accuracy', 'Optimized Loss']
        }
    ]

@app.post("/segment")
def segment_endpoint(req: SegmentRequest):
    try:
        results = run_rfm_segmentation(n_clusters=req.nClusters)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Segmentation Error: {str(e)}")

@app.get("/customers/segments")
def customers_segments_get(nClusters: int = Query(4)):
    try:
        return run_rfm_segmentation(n_clusters=nClusters)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Segmentation Error: {str(e)}")

@app.post("/recommend")
def recommend_endpoint(req: RecommendRequest):
    try:
        results = get_product_recommendations(product_id=req.productId, top_n=req.topN)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation Error: {str(e)}")

@app.get("/recommendations/product/{product_id}")
def recommend_product_get(product_id: str, topN: int = Query(5)):
    try:
        return get_product_recommendations(product_id=product_id, top_n=topN)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation Error: {str(e)}")

@app.get("/recommend/products")
def recommend_available_products():
    try:
        return get_available_products()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Products Error: {str(e)}")

@app.get("/inventory")
def inventory_get():
    try:
        demand = predict_inventory_demand()
        # Also auto-update alerts based on inventory
        if demand and "items" in demand:
            generate_inventory_alerts(demand["items"])
        return demand
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inventory Error: {str(e)}")

@app.post("/inventory-demand")
@app.post("/inventory/predict-demand")
def inventory_demand_endpoint(req: Optional[InventoryDemandRequest] = None):
    try:
        products = req.products if req else None
        results = predict_inventory_demand(products=products)
        if results and "items" in results:
            generate_inventory_alerts(results["items"])
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inventory Demand Error: {str(e)}")

# ----------------- Real-Time Alerts -----------------

@app.get("/alerts")
def alerts_get(severity: Optional[str] = Query(None), resolved: Optional[bool] = Query(None)):
    try:
        # Pre-seed alerts if empty
        data = get_alerts_data(severity=severity, resolved=resolved)
        if data['summary']['totalAlerts'] == 0:
            inv = predict_inventory_demand()
            if inv and "items" in inv:
                generate_inventory_alerts(inv["items"])
                data = get_alerts_data(severity=severity, resolved=resolved)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Alerts Error: {str(e)}")

@app.post("/alerts/generate")
def alerts_generate():
    try:
        inv = predict_inventory_demand()
        created = generate_inventory_alerts(inv.get("items", []))
        return {
            'status': 'success',
            'createdCount': len(created),
            'alerts': created
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generate Alerts Error: {str(e)}")

@app.patch("/alerts/{alert_id}/resolve")
def alerts_resolve(alert_id: str):
    success = resolve_alert_by_id(alert_id)
    return {'status': 'success' if success else 'not_found', 'resolved': True}

@app.delete("/alerts/{alert_id}")
def alerts_delete(alert_id: str):
    success = delete_alert_by_id(alert_id)
    return {'status': 'success' if success else 'not_found'}

# ----------------- Dataset Operations (Directly on CSV files) -----------------

@app.get("/data/datasets")
@app.get("/datasets")
def datasets_list():
    try:
        datasets = list_datasets()
        return {
            "status": "online",
            "datasets": datasets,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Datasets Error: {str(e)}")

@app.post("/data/upload")
async def data_upload_endpoint(
    file: UploadFile = File(...),
    datasetType: str = Form(...)
):
    """
    Accept CSV file directly from the frontend, validate, overwrite the dataset CSV,
    and automatically trigger ML model retraining.
    """
    try:
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are allowed.")

        content = await file.read()
        saved_info = save_uploaded_csv(dataset_type=datasetType, file_contents=content, filename=file.filename)

        # Trigger automatic ML retraining for the updated dataset
        retrain_res = {}
        try:
            if datasetType in ("all", "daily_sales_features"):
                retrain_res['forecasting'] = retrain_models()
            if datasetType in ("all", "customer_segments", "ecommerce_sales"):
                retrain_res['segmentation'] = retrain_segmentation()
            if datasetType in ("all", "ecommerce_sales"):
                retrain_res['recommendations'] = retrain_recommendations()
                retrain_res['inventory'] = retrain_inventory()
        except Exception as retrain_err:
            print(f"[Upload] Auto retrain warning: {retrain_err}")

        return {
            "message": f'Dataset "{datasetType}" uploaded and saved directly to dataset CSV with {saved_info["rowCount"]} rows.',
            "dataset": {
                "name": datasetType,
                "rowCount": saved_info["rowCount"],
                "columns": saved_info["columns"],
                "fileSize": saved_info["fileSize"],
                "status": "active"
            },
            "retrainResult": retrain_res,
            "preview": saved_info["preview"]
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload Error: {str(e)}")

@app.post("/data/add-rows")
def data_add_rows_endpoint(req: AddRowsRequest):
    """
    Append new rows directly to the dataset CSV file and trigger automatic retraining.
    """
    try:
        result = add_rows_to_dataset(dataset_type=req.datasetType, rows=req.rows)

        # Retrain relevant models
        retrain_res = {}
        try:
            if req.datasetType in ("all", "daily_sales_features"):
                retrain_res['forecasting'] = retrain_models()
            if req.datasetType in ("all", "customer_segments", "ecommerce_sales"):
                retrain_res['segmentation'] = retrain_segmentation()
            if req.datasetType in ("all", "ecommerce_sales"):
                retrain_res['recommendations'] = retrain_recommendations()
                retrain_res['inventory'] = retrain_inventory()
        except Exception as retrain_err:
            print(f"[Add Rows] Auto retrain warning: {retrain_err}")

        return {
            "message": f'Successfully added {result["rowsAdded"]} row(s) directly to dataset "{req.datasetType}". Total rows: {result["totalRows"]}',
            "rowsAdded": result["rowsAdded"],
            "totalRows": result["totalRows"],
            "retrainResult": retrain_res
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Add Rows Error: {str(e)}")

@app.get("/data/preview/{dataset_name}")
def data_preview_endpoint(dataset_name: str):
    try:
        return preview_dataset(dataset_name=dataset_name, max_rows=10)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Dataset {dataset_name} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preview Error: {str(e)}")

@app.delete("/data/{dataset_name}")
def data_delete_endpoint(dataset_name: str):
    try:
        return delete_dataset(dataset_name=dataset_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete Error: {str(e)}")

@app.post("/data/retrain")
@app.post("/retrain")
def retrain_endpoint(req: Optional[RetrainRequest] = None):
    """Re-train ML models using updated data files on disk."""
    try:
        results = {}
        dataset_type = req.datasetType if req and req.datasetType else "all"

        if dataset_type in ("all", "daily_sales_features"):
            results['forecasting'] = retrain_models()

        if dataset_type in ("all", "customer_segments", "ecommerce_sales"):
            results['segmentation'] = retrain_segmentation()

        if dataset_type in ("all", "ecommerce_sales"):
            results['recommendations'] = retrain_recommendations()
            results['inventory'] = retrain_inventory()

        return {
            "status": "success",
            "datasetType": dataset_type,
            "timestamp": datetime.now().isoformat(),
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retrain Error: {str(e)}")

@app.get("/data-status")
def data_status_endpoint():
    datasets = list_datasets()
    return {
        "status": "online",
        "dataDirectory": DATA_DIR,
        "datasets": {d['name']: d for d in datasets},
        "timestamp": datetime.now().isoformat()
    }

# ----------------- Dashboard Analytics Endpoints -----------------

@app.get("/dashboard/overview")
def dashboard_overview(period: str = Query("30 days")):
    try:
        return get_dashboard_overview(period_str=period)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Overview Error: {str(e)}")

@app.get("/dashboard/revenue-trend")
def dashboard_revenue_trend(period: str = Query("30 days")):
    try:
        return get_revenue_trend(period_str=period)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trend Error: {str(e)}")

@app.get("/dashboard/categories")
def dashboard_categories(period: str = Query("30 days")):
    try:
        return get_categories_breakdown(period_str=period)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Categories Error: {str(e)}")

@app.get("/dashboard/regions")
def dashboard_regions(period: str = Query("30 days")):
    try:
        return get_regions_breakdown(period_str=period)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Regions Error: {str(e)}")

@app.get("/dashboard/channels")
def dashboard_channels(period: str = Query("30 days")):
    try:
        return get_channels_breakdown(period_str=period)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Channels Error: {str(e)}")

@app.get("/dashboard/top-products")
def dashboard_top_products(period: str = Query("30 days")):
    try:
        return get_top_products(period_str=period, top_n=5)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Top Products Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
