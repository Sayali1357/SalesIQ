import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Navbar from '../components/Navbar';
import { 
  Bot, 
  Sparkles, 
  ShoppingBag, 
  Tag, 
  Percent, 
  ArrowRight, 
  CheckCircle2, 
  Layers
} from 'lucide-react';

const Recommendations = () => {
  const [selectedProductId, setSelectedProductId] = useState('PROD_001');
  const [loading, setLoading] = useState(false);
  const [recommendationData, setRecommendationData] = useState(null);

  const productOptions = [
    { id: 'PROD_001', name: 'Pro Laptop Ultra 15', category: 'Electronics', price: 85000 },
    { id: 'PROD_002', name: 'Smart Phone X Pro', category: 'Electronics', price: 45000 },
    { id: 'PROD_003', name: 'Noise-Canceling Headphones', category: 'Electronics', price: 15000 },
    { id: 'PROD_004', name: 'Ergonomic Office Chair', category: 'Furniture', price: 20000 },
    { id: 'PROD_005', name: 'Smart Watch Series 7', category: 'Electronics', price: 12000 },
    { id: 'PROD_006', name: 'Wireless Mechanical Keyboard', category: 'Electronics', price: 8500 }
  ];

  const fetchRecommendations = async (pid) => {
    setLoading(true);
    try {
      const { data } = await API.get(`/recommendations/product/${pid}?topN=5`);
      setRecommendationData(data);
    } catch (error) {
      console.error('Error loading product recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations(selectedProductId);
  }, [selectedProductId]);

  return (
    <div className="flex-1 overflow-y-auto bg-background min-h-screen">
      <Navbar title="AI Product Recommendations" subtitle="Collaborative filtering & cosine similarity engine based on customer purchase history matrix" />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Product Selector Bar */}
        <div className="bi-card border-primary/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Bot className="text-primary-light" size={22} />
                Cosine Similarity Matrix Recommender
              </h2>
              <p className="text-xs text-slate-400">Select a seed product to inspect top recommended co-purchased items</p>
            </div>

            <div className="w-full sm:w-80">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Seed Product Target:</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="bi-input w-full font-medium"
              >
                {productOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Selected Product Card */}
        {recommendationData && recommendationData.selectedProduct && (
          <div className="bg-gradient-to-r from-primary/20 via-card to-card border border-primary/40 rounded-xl p-6 shadow-glow">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary-light flex items-center justify-center border border-primary/40">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <span className="text-xs font-bold text-primary-light uppercase tracking-wider">
                    {recommendationData.selectedProduct.productId}
                  </span>
                  <h2 className="text-xl font-extrabold text-white">{recommendationData.selectedProduct.productName}</h2>
                  <p className="text-xs text-slate-400 font-medium">{recommendationData.selectedProduct.category}</p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-400 font-medium">Catalog Unit Price</span>
                <h3 className="text-2xl font-extrabold text-emerald-400">
                  ₹{recommendationData.selectedProduct.price.toLocaleString('en-IN')}
                </h3>
              </div>
            </div>
          </div>
        )}

        {/* Recommended Products Grid */}
        <div>
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400" />
            Top 5 Recommended Products (Cosine Similarity Matrix)
          </h3>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Calculating similarity scores...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recommendationData && recommendationData.recommendations && recommendationData.recommendations.map((rec, idx) => (
                <div key={rec.productId} className="bi-card relative group hover:border-primary/50 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-400">#{idx + 1} {rec.productId}</span>
                      <h4 className="text-base font-bold text-white group-hover:text-primary-light transition-colors mt-0.5">
                        {rec.productName}
                      </h4>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 mt-2">
                        {rec.category}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-emerald-400">
                        ₹{rec.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Similarity Score:</span>
                      <span className="text-primary-light font-mono font-bold">{rec.similarityScore}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-medium text-slate-400">
                        <span>Match Confidence:</span>
                        <span className="text-emerald-400 font-bold">{rec.matchPercentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-cyan-light rounded-full"
                          style={{ width: `${rec.matchPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Recommendations;
