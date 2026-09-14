import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from services.forecasting import generate_forecast, retrain_models
from services.segmentation import run_rfm_segmentation, retrain_segmentation
from services.recommendation import get_product_recommendations, retrain_recommendations
from services.inventory_demand import predict_inventory_demand, retrain_inventory

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data'))

app = FastAPI(
    title="SalesIQ Python ML Service",
    description="Machine Learning Service for SalesIQ Analytics Platform",
    version="1.1.0"
)

# Enable CORS for Node.js API Gateway
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "SalesIQ Machine Learning Service",
        "version": "1.1.0",
        "endpoints": ["/forecast", "/segment", "/recommend", "/inventory-demand", "/retrain", "/data-status"]
    }

@app.post("/forecast")
def forecast_endpoint(req: ForecastRequest):
    try:
        results = generate_forecast(model_name=req.model, forecast_days=req.forecastDays)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting Error: {str(e)}")

@app.post("/segment")
def segment_endpoint(req: SegmentRequest):
    try:
        results = run_rfm_segmentation(n_clusters=req.nClusters)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Segmentation Error: {str(e)}")

@app.post("/recommend")
def recommend_endpoint(req: RecommendRequest):
    try:
        results = get_product_recommendations(product_id=req.productId, top_n=req.topN)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation Error: {str(e)}")

@app.post("/inventory-demand")
def inventory_demand_endpoint(req: InventoryDemandRequest):
    try:
        results = predict_inventory_demand(products=req.products)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inventory Demand Error: {str(e)}")

@app.post("/retrain")
def retrain_endpoint(req: RetrainRequest):
    """Re-train ML models using updated data files on disk."""
    try:
        results = {}
        dataset_type = req.datasetType or "all"
        
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
    """Return status of data files on disk."""
    try:
        datasets = {}
        csv_files = {
            'ecommerce_sales': 'ecommerce_sales.csv',
            'daily_sales_features': 'daily_sales_features.csv',
            'customer_segments': 'customer_segments.csv'
        }
        
        for name, filename in csv_files.items():
            filepath = os.path.join(DATA_DIR, filename)
            if os.path.exists(filepath):
                stat = os.stat(filepath)
                # Count lines (rows) quickly
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    line_count = sum(1 for _ in f) - 1  # subtract header
                
                datasets[name] = {
                    'exists': True,
                    'fileSizeBytes': stat.st_size,
                    'fileSizeMB': round(stat.st_size / (1024 * 1024), 2),
                    'rowCount': max(0, line_count),
                    'lastModified': datetime.fromtimestamp(stat.st_mtime).isoformat()
                }
            else:
                datasets[name] = {
                    'exists': False,
                    'fileSizeBytes': 0,
                    'fileSizeMB': 0,
                    'rowCount': 0,
                    'lastModified': None
                }
        
        return {
            "status": "online",
            "dataDirectory": DATA_DIR,
            "datasets": datasets,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data Status Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
