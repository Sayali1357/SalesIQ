const { getProductRecommendations } = require('../services/mlService');
const Product = require('../models/Product');

const getRecommendationsByProduct = async (req, res) => {
  try {
    const productId = req.params.id || req.query.productId;
    const topN = req.query.topN || 5;

    const result = await getProductRecommendations(productId, parseInt(topN));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRecommendationsByCustomer = async (req, res) => {
  try {
    const customerId = req.params.id;
    // Call python recommendation service with customer context
    const result = await getProductRecommendations(null, 5);
    res.json({
      customerId,
      recommendedProducts: result.recommendations
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getRecommendationsByProduct,
  getRecommendationsByCustomer
};
