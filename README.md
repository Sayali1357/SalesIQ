# SalesIQ — Intelligent Sales Analytics & Forecasting Platform

AI-powered sales analytics, machine learning revenue forecasting, customer RFM segmentation, cosine similarity product recommendations, inventory demand coverage, and real-time business anomaly detection.

---

## 🏗️ Architecture

```text
                                  SALESIQ PLATFORM

                                 React + Vite Frontend
                                (Dark BI Theme / Recharts)
                                           │
                                           ▼
                                 Express REST API Gateway
                                   (JWT & Role Auth)
                                           │
                        ┌──────────────────┼──────────────────┐
                        │                  │                  │
                        ▼                  ▼                  ▼
                   MongoDB Database   Python ML API       Alert & Seed Engine
                  (Mongoose Models)   (FastAPI / Port 8000)
                                           │
                     ┌─────────────────────┼─────────────────────┐
                     │                     │                     │
                     ▼                     ▼                     ▼
             Sales Forecasting    Customer Segmentation   Product Recommendations
            (Ridge, RF, XGBoost)   (RFM + K-Means + PCA)   (Cosine Similarity Matrix)
```

---

## ⚡ Quick Start Guide

### 1. Python ML Service Setup
```bash
cd ml-service
pip install -r requirements.txt
python main.py
```
> Running on `http://localhost:8000`

### 2. Node.js Backend Setup
```bash
cd server
npm install
npm run seed     # Seed MongoDB with dataset & default user accounts
npm run dev      # Start Express REST Gateway
```
> Running on `http://localhost:5000`

### 3. React Frontend Setup
```bash
cd client
npm install
npm run dev
```
> Running on `http://localhost:3000`

---

## 🔑 Demo Account Credentials

| Account | Email | Password | Role | Access Level |
|---|---|---|---|---|
| **Admin** | `admin@salesiq.com` | `admin123` | `Admin` | Full Access (Dashboard, ML Models, Segmentation, Inventory, Alerts, Admin Panel) |
| **Manager** | `manager@salesiq.com` | `manager123` | `Manager` | BI Analytics, Forecasting, Customer Segments, Recommendations, Inventory, Alerts |

---

## 📊 Core Features

1. **Dashboard**: KPIs (Total Revenue, Orders, Customers, AOV), 7-Day Moving Average trend, Category distribution, Regional sales map, Channel breakdown, Top performing products.
2. **Sales Forecasting**: Machine Learning models (Ridge Regression, Random Forest, Gradient Boosting) multi-step recursive revenue prediction with confidence intervals and feature importances.
3. **Customer Segmentation**: RFM calculation (Recency, Frequency, Monetary), K-Means clustering, 2D PCA cluster map visualization, and paginated customer directory.
4. **Product Recommendations**: Cosine similarity engine calculated over customer purchase interaction matrix.
5. **Inventory & Demand**: Automated daily demand calculation, stock coverage days estimation (`Current Stock / Predicted Daily Demand`), and status badges.
6. **Automated KPI Alerts**: Automated scanner detecting revenue drops, stockouts, low stock thresholds, and high return rates.
7. **Admin Panel**: User role management, account creation, activation toggles, and database telemetry statistics.
