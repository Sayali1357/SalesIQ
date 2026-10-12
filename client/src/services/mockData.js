// Comprehensive High-Fidelity Fallback Dataset
// Ensures dashboard and ML visualization charts are always rendered smoothly even during:
// 1. Initial cold start on cloud providers (e.g. Render / Heroku 50s spin up)
// 2. Offline / local testing without Python microservice
// 3. Temporary network timeouts or misconfigured VITE_ML_API_URL

export const generateDefaultRevenueTrend = () => {
  const trend = [];
  const now = new Date();
  let baseRevenue = 38000;

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const noise = Math.sin(i * 0.7) * 6000 + (Math.random() - 0.5) * 4000;
    const weekendBoost = isWeekend ? 8000 : 0;
    const revenue = Math.round(baseRevenue + noise + weekendBoost);
    const orders = Math.round(revenue / 2200 + Math.random() * 5);
    
    trend.push({
      date: dateStr,
      revenue: Math.max(18000, revenue),
      orders: Math.max(8, orders),
      movingAverage: Math.round(baseRevenue + noise * 0.4)
    });
  }
  return trend;
};

export const defaultCategories = [
  { category: 'Electronics', revenue: 425000, units: 1420, percentage: 34.0 },
  { category: 'Apparel & Fashion', revenue: 310000, units: 2150, percentage: 24.8 },
  { category: 'Home & Kitchen', revenue: 245000, units: 1680, percentage: 19.6 },
  { category: 'Beauty & Health', revenue: 165000, units: 1120, percentage: 13.2 },
  { category: 'Sports & Fitness', revenue: 105000, units: 810, percentage: 8.4 }
];

export const defaultRegions = [
  { region: 'North', revenue: 385000, orders: 1540 },
  { region: 'West', revenue: 345000, orders: 1380 },
  { region: 'South', revenue: 295000, orders: 1210 },
  { region: 'East', revenue: 225000, orders: 1118 }
];

export const defaultChannels = [
  { channel: 'Direct Web', revenue: 580000, orders: 2420 },
  { channel: 'Mobile App', revenue: 420000, orders: 1780 },
  { channel: 'Marketplaces', revenue: 180000, orders: 748 },
  { channel: 'Social Commerce', revenue: 70000, orders: 300 }
];

export const defaultTopProducts = [
  { productId: 'PROD_101', productName: 'Wireless Active Noise Canceling Headphones', category: 'Electronics', revenue: 142000, unitsSold: 284 },
  { productId: 'PROD_204', productName: 'Smart Fitness Tracker Band 5.0', category: 'Electronics', revenue: 118000, unitsSold: 393 },
  { productId: 'PROD_318', productName: 'Ergonomic Memory Foam Lumbar Support', category: 'Home & Kitchen', revenue: 89000, unitsSold: 445 },
  { productId: 'PROD_412', productName: 'Organic Cotton Casual Oxford Shirt', category: 'Apparel & Fashion', revenue: 76000, unitsSold: 380 },
  { productId: 'PROD_521', productName: 'Stainless Steel Insulated Thermal Tumbler', category: 'Home & Kitchen', revenue: 64000, unitsSold: 533 }
];

export const generateDefaultForecast = (forecastDays = 30, selectedModel = 'random_forest') => {
  const combinedCurve = [];
  const forecastList = [];
  const now = new Date();

  // 30 days historical
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const val = Math.round(35000 + Math.sin(i * 0.6) * 6000 + (Math.random() - 0.5) * 3000);
    combinedCurve.push({
      date: dateStr,
      actual_sales: val,
      forecast: null
    });
  }

  // Future days forecast
  let totalPredicted = 0;
  for (let i = 1; i <= forecastDays; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const val = Math.round(38000 + (i * 220) + Math.sin(i * 0.5) * 5500);
    const lower = Math.round(val * 0.88);
    const upper = Math.round(val * 1.12);
    totalPredicted += val;

    combinedCurve.push({
      date: dateStr,
      actual_sales: null,
      forecast: val,
      lower_bound: lower,
      upper_bound: upper
    });

    forecastList.push({
      date: dateStr,
      forecast: val,
      lower_bound: lower,
      upper_bound: upper
    });
  }

  return {
    model: selectedModel,
    selectedModel: selectedModel.replace('_', ' ').toUpperCase(),
    forecastDays,
    summary: {
      totalPredictedRevenue: totalPredicted,
      avgDailyForecast: Math.round(totalPredicted / forecastDays)
    },
    metrics: {
      mae: 1845.2,
      rmse: 2410.8,
      r2: 0.914
    },
    modelComparison: [
      {
        model: 'Random Forest Regressor',
        modelKey: 'random_forest',
        mae: 1845.2,
        rmse: 2410.8,
        r2: 0.914,
        isBest: true,
        description: 'Ensemble bagging across 100 decision trees capturing non-linear interactions.'
      },
      {
        model: 'Gradient Boosting Regressor',
        modelKey: 'gradient_boosting',
        mae: 1980.5,
        rmse: 2590.1,
        r2: 0.898,
        isBest: false,
        description: 'Sequential boosting optimizing pseudo-residuals across gradient steps.'
      },
      {
        model: 'Ridge Regression (L2)',
        modelKey: 'ridge',
        mae: 2340.0,
        rmse: 3120.4,
        r2: 0.842,
        isBest: false,
        description: 'L2 regularization baseline linear regression with standardized features.'
      }
    ],
    featureImportance: [
      { feature: 'lag_1 (Previous Day)', importance: 0.32 },
      { feature: 'rolling_mean_7 (7d Avg)', importance: 0.24 },
      { feature: 'lag_7 (Last Week)', importance: 0.17 },
      { feature: 'rolling_mean_14', importance: 0.11 },
      { feature: 'day_of_week', importance: 0.08 },
      { feature: 'is_weekend', importance: 0.05 },
      { feature: 'lag_14', importance: 0.03 }
    ],
    combinedCurve,
    forecast: forecastList
  };
};

export const generateDefaultSegmentation = (nClusters = 4) => {
  const segments = [
    { segmentName: 'Champions', count: 142, r: 12, f: 18, m: 24500, color: '#8b5cf6', cx: 2.2, cy: 1.8 },
    { segmentName: 'Loyal Customers', count: 165, r: 34, f: 11, m: 15200, color: '#06b6d4', cx: 0.6, cy: 0.4 },
    { segmentName: 'At Risk', count: 110, r: 96, f: 5, m: 8200, color: '#f59e0b', cx: -1.2, cy: -0.8 },
    { segmentName: 'Lost Customers', count: 70, r: 182, f: 2, m: 2400, color: '#ef4444', cx: -2.4, cy: -1.9 }
  ];

  const activeSegments = segments.slice(0, nClusters);
  const segmentsSummary = activeSegments.map(s => ({
    segmentName: s.segmentName,
    customerCount: s.count,
    avgRecency: s.r,
    avgFrequency: s.f,
    avgMonetary: s.m,
    color: s.color
  }));

  const pcaPoints = [];
  const customers = [];

  activeSegments.forEach((seg, idx) => {
    for (let i = 0; i < 25; i++) {
      const custId = `CUST_${1000 + idx * 30 + i}`;
      const pca1 = Number((seg.cx + (Math.random() - 0.5) * 1.2).toFixed(2));
      const pca2 = Number((seg.cy + (Math.random() - 0.5) * 1.2).toFixed(2));
      const rec = Math.max(1, Math.round(seg.r + (Math.random() - 0.5) * 20));
      const freq = Math.max(1, Math.round(seg.f + (Math.random() - 0.5) * 4));
      const mon = Math.max(500, Math.round(seg.m + (Math.random() - 0.5) * 4000));

      pcaPoints.push({
        customerId: custId,
        pca1,
        pca2,
        segment: seg.segmentName,
        cluster: idx,
        recency: rec,
        frequency: freq,
        monetary: mon
      });

      customers.push({
        customerId: custId,
        recency: rec,
        frequency: freq,
        monetary: mon,
        cluster: idx,
        segment: seg.segmentName
      });
    }
  });

  return {
    totalCustomers: 487,
    nClusters,
    segmentsSummary,
    pcaPoints,
    customers
  };
};

export const defaultAlertsData = {
  summary: {
    totalAlerts: 4,
    critical: 1,
    warning: 2,
    info: 1,
    resolved: 1
  },
  alerts: [
    {
      _id: 'alt_1',
      id: 'alt_1',
      alertType: 'Out of Stock',
      title: 'Critical Out of Stock: PROD_101',
      message: 'Product PROD_101 current inventory hit 0 units. Replenish immediately.',
      severity: 'Critical',
      resolved: false,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      _id: 'alt_2',
      id: 'alt_2',
      alertType: 'Revenue Drop',
      title: 'Significant Revenue Drop (-26.2%)',
      message: 'Daily revenue dropped by 26.2% compared to the previous 7-day rolling baseline.',
      severity: 'Critical',
      resolved: false,
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
    },
    {
      _id: 'alt_3',
      id: 'alt_3',
      alertType: 'Low Stock',
      title: 'Low Stock Warning: PROD_204',
      message: 'Product PROD_204 stock level (18 units) has breached reorder threshold (30 units).',
      severity: 'Warning',
      resolved: false,
      createdAt: new Date(Date.now() - 3600000 * 14).toISOString()
    },
    {
      _id: 'alt_4',
      id: 'alt_4',
      alertType: 'High Return Rate',
      title: 'Elevated Return Rate (16.4%)',
      message: 'Channel returns reached 16.4%, surpassing the 15% operational risk threshold.',
      severity: 'Warning',
      resolved: true,
      createdAt: new Date(Date.now() - 3600000 * 26).toISOString()
    }
  ]
};

export const getDefaultRecommendations = (seedProductId = 'PROD_001') => {
  const catalog = [
    { id: 'PROD_001', name: 'Pro Laptop Ultra 15', category: 'Electronics', price: 85000 },
    { id: 'PROD_002', name: 'Smart Phone X Pro', category: 'Electronics', price: 45000 },
    { id: 'PROD_003', name: 'Noise-Canceling Headphones', category: 'Electronics', price: 15000 },
    { id: 'PROD_004', name: 'Ergonomic Office Chair', category: 'Furniture', price: 20000 },
    { id: 'PROD_005', name: 'Smart Watch Series 7', category: 'Electronics', price: 12000 },
    { id: 'PROD_006', name: 'Wireless Mechanical Keyboard', category: 'Electronics', price: 8500 },
    { id: 'PROD_007', name: '4K Ultra HD Monitor 27"', category: 'Electronics', price: 32000 },
    { id: 'PROD_008', name: 'USB-C Multiport Docking Station', category: 'Electronics', price: 6500 }
  ];

  const seed = catalog.find(p => p.id === seedProductId) || catalog[0];
  const others = catalog.filter(p => p.id !== seed.id);
  const simScores = [0.942, 0.887, 0.824, 0.765, 0.712];

  const recommendations = others.slice(0, 5).map((item, idx) => ({
    productId: item.id,
    productName: item.name,
    category: item.category,
    price: item.price,
    similarityScore: simScores[idx] || 0.65,
    matchPercentage: Math.round((simScores[idx] || 0.65) * 1000) / 10
  }));

  return {
    selectedProduct: {
      productId: seed.id,
      productName: seed.name,
      category: seed.category,
      price: seed.price
    },
    recommendations
  };
};

