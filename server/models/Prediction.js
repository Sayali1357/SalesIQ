const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  predictionDate: { type: Date, default: Date.now },
  modelName: { type: String, required: true },
  forecastPeriod: { type: Number, required: true },
  predictedSales: { type: Number, required: true },
  MAE: { type: Number, required: true },
  RMSE: { type: Number, required: true },
  R2: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Prediction', predictionSchema);
