import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import { 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  XCircle, 
  RefreshCw, 
  Sparkles, 
  TrendingDown, 
  Clock
} from 'lucide-react';

const Inventory = () => {
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [inventoryData, setInventoryData] = useState({
    summary: {
      totalProducts: 50,
      healthyStock: 32,
      lowStock: 10,
      criticalStock: 5,
      outOfStock: 3
    },
    items: []
  });

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/inventory');
      if (data) setInventoryData(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePredictDemand = async () => {
    setPredicting(true);
    try {
      const { data } = await API.post('/inventory/predict-demand');
      if (data) setInventoryData(data);
    } catch (error) {
      console.error('Error predicting demand:', error);
    } finally {
      setPredicting(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Out of Stock':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center gap-1">
            <XCircle size={12} /> Out of Stock
          </span>
        );
      case 'Critical':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center gap-1">
            <AlertOctagon size={12} /> Critical
          </span>
        );
      case 'Low Stock':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-300 border border-yellow-500/30 flex items-center justify-center gap-1">
            <AlertTriangle size={12} /> Low Stock
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1">
            <CheckCircle2 size={12} /> Healthy
          </span>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background min-h-screen">
      <Navbar title="Inventory & Demand Management" subtitle="Monitor stock levels, demand predictions, and stockout coverage days" />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Top Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Package size={22} className="text-primary-light" />
            Inventory Control Center
          </h1>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePredictDemand}
              disabled={predicting}
              className="bi-btn-primary text-xs py-2 px-4"
            >
              {predicting ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Calculating Demand...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles size={15} /> Predict Inventory Demand
                </span>
              )}
            </button>

            <button
              onClick={fetchInventory}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* 5 Stock Status Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bi-card">
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Products</p>
            <h3 className="text-2xl font-bold text-white mt-1">{inventoryData.summary.totalProducts}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Monitored Items</p>
          </div>

          <div className="bi-card border-l-4 border-l-emerald-500">
            <p className="text-xs font-semibold text-emerald-400 uppercase">Healthy Stock</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">{inventoryData.summary.healthyStock}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Sufficient Stock</p>
          </div>

          <div className="bi-card border-l-4 border-l-yellow-500">
            <p className="text-xs font-semibold text-yellow-300 uppercase">Low Stock</p>
            <h3 className="text-2xl font-bold text-yellow-300 mt-1">{inventoryData.summary.lowStock}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Below Reorder Level</p>
          </div>

          <div className="bi-card border-l-4 border-l-amber-500">
            <p className="text-xs font-semibold text-amber-400 uppercase">Critical Stock</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">{inventoryData.summary.criticalStock}</h3>
            <p className="text-[11px] text-slate-400 mt-1">&lt; 10 Units Remaining</p>
          </div>

          <div className="bi-card border-l-4 border-l-rose-500">
            <p className="text-xs font-semibold text-rose-400 uppercase">Out of Stock</p>
            <h3 className="text-2xl font-bold text-rose-400 mt-1">{inventoryData.summary.outOfStock}</h3>
            <p className="text-[11px] text-slate-400 mt-1">0 Units Left</p>
          </div>
        </div>

        {/* Inventory Master Table */}
        <div className="bi-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Package size={18} className="text-cyan-light" />
              Product Inventory & Daily Demand Matrix
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Current Stock</th>
                  <th className="px-4 py-3 text-right">Reorder Level</th>
                  <th className="px-4 py-3 text-right">Predicted Daily Demand</th>
                  <th className="px-4 py-3 text-right">Coverage Days</th>
                  <th className="px-4 py-3 text-center">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {inventoryData.items.map((item) => (
                  <tr key={item.productId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">
                      {item.productName || item.productId}
                      <span className="block text-[11px] font-mono text-slate-400">{item.productId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {item.category || 'General'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-white">
                      {item.currentStock} units
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400">
                      {item.reorderLevel} units
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-cyan-light font-bold">
                      {item.predictedDailyDemand} / day
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                      {item.estimatedCoverageDays} Days
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(item.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Inventory;
