import React, { useState, useEffect } from 'react';
import ML_API from '../services/mlApi';
import Navbar from '../components/Navbar';
import { 
  Bot, 
  Sparkles, 
  ShoppingBag, 
  Tag, 
  Percent, 
  ArrowRight, 
  CheckCircle2, 
  Layers,
  Wifi,
  WifiOff
} from 'lucide-react';
import { getDefaultRecommendations } from '../services/mockData';
import { getCached, setCached } from '../services/cache';

const Recommendations = () => {
  const [selectedProductId, setSelectedProductId] = useState('PROD_001');
  const [loading, setLoading] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  
  // Instant Initial State eliminates 0-latency first paint delays
  const [recommendationData, setRecommendationData] = useState(() => 
    getCached('rec_PROD_001') || getDefaultRecommendations('PROD_001')
  );

  const [productOptions, setProductOptions] = useState([
    { id: 'PROD_001', name: 'Pro Laptop Ultra 15', category: 'Electronics', price: 85000 },
    { id: 'PROD_002', name: 'Smart Phone X Pro', category: 'Electronics', price: 45000 },
    { id: 'PROD_003', name: 'Noise-Canceling Headphones', category: 'Electronics', price: 15000 },
    { id: 'PROD_004', name: 'Ergonomic Office Chair', category: 'Furniture', price: 20000 },
    { id: 'PROD_005', name: 'Smart Watch Series 7', category: 'Electronics', price: 12000 },
    { id: 'PROD_006', name: 'Wireless Mechanical Keyboard', category: 'Electronics', price: 8500 }
  ]);

  useEffect(() => {
    const fetchAvailableProducts = async () => {
      const cached = getCached('rec_products');
      if (cached) {
        setProductOptions(cached);
        return;
      }
      try {
        const { data } = await ML_API.get('/recommend/products');
        if (data && data.length > 0) {
          setProductOptions(data);
          setCached('rec_products', data);
        }
      } catch (err) {
        // Fallback to initial options
      }
    };
    fetchAvailableProducts();
  }, []);

  const fetchRecommendations = async (pid) => {
    const cacheKey = `rec_${pid}`;
    const cached = getCached(cacheKey);
    if (cached) {
      setRecommendationData(cached);
      return;
    }

    setLoading(true);
    try {
      const { data } = await ML_API.get(`/recommendations/product/${pid}?topN=5`);
      if (data && data.recommendations && data.recommendations.length > 0) {
        setRecommendationData(data);
        setCached(cacheKey, data);
        setIsLiveConnected(true);
      } else {
        const fallback = getDefaultRecommendations(pid);
        setRecommendationData(fallback);
      }
    } catch (error) {
      console.warn('Live recommendation engine deferred, using calculated item affinity:', error);
      setIsLiveConnected(false);
      const fallback = getDefaultRecommendations(pid);
      setRecommendationData(fallback);
      setCached(cacheKey, fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProductId) {
      fetchRecommendations(selectedProductId);
    }
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

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span 
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1.5 border transition-all ${
                  isLiveConnected 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}
              >
                {isLiveConnected ? (
                  <>
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                    <Wifi size={12} />
                    <span>Live Model</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                    <WifiOff size={12} />
                    <span>Instant Matrix</span>
                  </>
                )}
              </span>

              <div className="w-full sm:w-72">
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
        </div>

        {/* Selected Product Hero Details */}
        {recommendationData && recommendationData.selectedProduct && (
          <div className="bi-card bg-gradient-to-r from-card via-slate-900 to-card border-primary/40 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-full bg-primary/5 -skew-x-12 pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary-light">
                  <ShoppingBag size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Target Anchor Item
                    </span>
                    <span className="text-xs text-primary-light font-semibold">
                      {recommendationData.selectedProduct.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1">
                    {recommendationData.selectedProduct.productName}
                  </h3>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="text-xs text-slate-400 block">Baseline Price</span>
                <span className="text-2xl font-extrabold text-white">
                  ₹{Number(recommendationData.selectedProduct.price).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Top Recommendations Cards Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              Frequently Bought Together (Top Recommendations)
            </h3>
            {loading && (
              <span className="text-xs text-primary-light animate-pulse flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span> Refreshing...
              </span>
            )}
          </div>

          {recommendationData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recommendationData.recommendations.map((item, idx) => (
                <div 
                  key={item.productId} 
                  className="bi-card relative hover:border-primary/60 transition-all hover:-translate-y-1 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 font-bold text-xs flex items-center justify-center text-slate-300">
                      #{idx + 1}
                    </span>

                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {item.matchPercentage}% Affinity Match
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white mb-1 group-hover:text-primary-light transition-colors line-clamp-1">
                    {item.productName}
                  </h4>

                  <p className="text-xs text-slate-400 mb-4">{item.category}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Cosine Similarity:</span>
                      <span className="font-mono text-slate-200 font-semibold">{item.similarityScore}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-400 h-full rounded-full" 
                        style={{ width: `${item.matchPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">List Price</span>
                      <span className="text-base font-extrabold text-white">
                        ₹{Number(item.price).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <button 
                      onClick={() => setSelectedProductId(item.productId)}
                      className="text-xs text-primary-light hover:text-white flex items-center gap-1 font-medium transition-colors"
                    >
                      Inspect <ArrowRight size={14} />
                    </button>
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
