const { getForecast } = require('../services/mlService');
const Prediction = require('../models/Prediction');

// Generate Sales Forecast via ML Service
const generateSalesForecast = async (req, res) => {
  try {
    const { model = 'random_forest', forecastDays = 30 } = req.body;

    const forecastData = await getForecast(model, parseInt(forecastDays));

    // Save prediction execution log in MongoDB
    try {
      await Prediction.create({
        modelName: forecastData.selectedModel,
        forecastPeriod: parseInt(forecastDays),
        predictedSales: forecastData.summary.totalPredictedRevenue,
        MAE: forecastData.metrics.mae,
        RMSE: forecastData.metrics.rmse,
        R2: forecastData.metrics.r2
      });
    } catch (dbErr) {
      console.warn('[Prediction] Log saving skipped or DB offline:', dbErr.message);
    }

    res.json(forecastData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Prediction History Logs
const getForecastHistory = async (req, res) => {
  try {
    const history = await Prediction.find().sort({ createdAt: -1 }).limit(20);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Available Forecasting Models Metainfo
const getAvailableModels = async (req, res) => {
  res.json([
    {
      key: 'ridge',
      name: 'Ridge Regression',
      type: 'Linear Regularized',
      description: 'Linear regression model with L2 regularization used as baseline forecasting model.',
      features: ['L2 Penalty', 'Fast Inference', 'Baseline Metric']
    },
    {
      key: 'random_forest',
      name: 'Random Forest',
      type: 'Ensemble Bagging',
      description: 'Ensemble model that captures non-linear relationships between lag features and sales.',
      features: ['Feature Importances', 'Non-linear boundaries', 'Robust against outliers']
    },
    {
      key: 'gradient_boosting',
      name: 'Gradient Boosting',
      type: 'Sequential Boosting',
      description: 'Sequential ensemble model where new trees improve errors from previous trees.',
      features: ['Iterative Error Reduction', 'High Accuracy', 'Optimized Residual Loss']
    }
  ]);
};

module.exports = {
  generateSalesForecast,
  getForecastHistory,
  getAvailableModels
};
