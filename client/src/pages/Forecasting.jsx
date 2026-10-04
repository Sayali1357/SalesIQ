import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import { 
  TrendingUp, 
  Sparkles, 
  BrainCircuit, 
  Calendar, 
  CheckCircle2, 
  Sliders, 
  Table, 
  BarChart2, 
  Play,
  IndianRupee,
  Clock,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';

const Forecasting = () => {
  const [selectedModel, setSelectedModel] = useState('random_forest');
  const [forecastDays, setForecastDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState(null);
  const debounceTimerRef = useRef(null);

  const runForecast = async (model = selectedModel, days = forecastDays) => {
    setLoading(true);
    try {
      const { data } = await API.post('/forecast', {
        model,
        forecastDays: parseInt(days, 10)
      });
      setForecastData(data);
    } catch (error) {
      console.error('Forecasting error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Trigger forecast dynamically with debounce when model or forecastDays changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      runForecast(selectedModel, forecastDays);
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [selectedModel, forecastDays]);

  return (
    <div className="flex-1 overflow-y-auto bg-background min-h-screen">
      <Navbar title="Sales Forecasting" subtitle="Machine learning forecast of future daily revenue using historical patterns" />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Controls Card */}
        <div className="bi-card border-primary/40 bg-card/90">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BrainCircuit className="text-primary-light" size={22} />
              Forecasting Model Engine Controls
            </h2>
            <span className="text-xs bg-primary/20 text-primary-light border border-primary/30 px-2.5 py-1 rounded-full font-semibold">
              Scikit-Learn Python ML Service
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bi-input w-full"
              >
                <option value="random_forest">Random Forest Regression (Ensemble)</option>
                <option value="gradient_boosting">Gradient Boosting Regression (Sequential)</option>
                <option value="ridge">Ridge Regression (L2 Baseline)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex justify-between">
                <span>Forecast Horizon</span>
                <span className="text-primary-light font-bold text-sm bg-primary/10 border border-primary/30 px-2 py-0.5 rounded">
                  {forecastDays} days
                </span>
              </label>
              <input
                type="range"
                min="7"
                max="60"
                step="1"
                value={forecastDays}
                onChange={(e) => setForecastDays(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>7 days</span>
                <span>30 days</span>
                <span>60 days</span>
              </div>
            </div>

            <div>
              <button
                onClick={() => runForecast(selectedModel, forecastDays)}
                disabled={loading}
                className="bi-btn-primary w-full py-2.5 text-sm font-semibold"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Calculating {forecastDays}d ML Forecast...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Play size={16} /> Run ML Forecast
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Model Evaluation & Horizon Summary Cards */}
        {forecastData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bi-card border-primary/30 bg-primary/5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400 uppercase">Predicted Revenue ({forecastData.forecastDays}d)</p>
                <Clock size={16} className="text-primary-light" />
              </div>
              <h3 className="text-2xl font-extrabold text-white mt-1">
                ₹{forecastData.summary?.totalPredictedRevenue ? Number(forecastData.summary.totalPredictedRevenue).toLocaleString('en-IN') : '0'}
              </h3>
              <p className="text-[11px] text-primary-light mt-2 font-medium">
                ₹{forecastData.summary?.avgDailyForecast ? Number(forecastData.summary.avgDailyForecast).toLocaleString('en-IN') : '0'} / day avg run-rate
              </p>
            </div>

            <div className="bi-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400 uppercase">Mean Absolute Error (MAE)</p>
                <span className="text-[10px] text-slate-400 font-mono">Residual</span>
              </div>
              <h3 className="text-2xl font-extrabold text-primary-light mt-1">₹{forecastData.metrics?.mae}</h3>
              <p className="text-[11px] text-emerald-400 mt-2">Average residual error</p>
            </div>

            <div className="bi-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400 uppercase">Root Mean Sq Error (RMSE)</p>
                <span className="text-[10px] text-slate-400 font-mono">Std Dev</span>
              </div>
              <h3 className="text-2xl font-extrabold text-cyan-light mt-1">₹{forecastData.metrics?.rmse}</h3>
              <p className="text-[11px] text-slate-400 mt-2">Standard deviation of residuals</p>
            </div>

            <div className="bi-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400 uppercase">R² Score (Accuracy)</p>
                <span className="text-[10px] text-emerald-400 font-bold">Good fit</span>
              </div>
              <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{forecastData.metrics?.r2}</h3>
              <p className="text-[11px] text-emerald-400 mt-2">Variance explained by {forecastData.selectedModel}</p>
            </div>
          </div>
        )}

        {/* Model Comparison Table */}
        {forecastData && forecastData.modelComparison && (
          <div className="bi-card">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Table size={18} className="text-primary-light" />
              Machine Learning Model Comparison
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">MAE (₹)</th>
                    <th className="px-4 py-3 text-right">RMSE (₹)</th>
                    <th className="px-4 py-3 text-right">R² Score</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {forecastData.modelComparison.map((m) => (
                    <tr 
                      key={m.modelKey} 
                      onClick={() => setSelectedModel(m.modelKey)}
                      className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        selectedModel === m.modelKey ? 'bg-primary/15 border-l-4 border-l-primary' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                        {m.model}
                        {m.isBest && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Best Model
                          </span>
                        )}
                        {selectedModel === m.modelKey && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs max-w-md">{m.description}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-200">₹{m.mae}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-200">₹{m.rmse}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">{m.r2}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Evaluated
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Revenue Forecast Visualization Chart */}
        {forecastData && (
          <div className="bi-card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp size={18} className="text-cyan-light" />
                  Revenue Forecast Curve & Confidence Band ({forecastData.forecastDays} Days Horizon)
                </h3>
                <p className="text-xs text-slate-400">Historical actual revenue vs ML predicted multi-step horizon</p>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-primary-light">
                  <span className="w-3 h-0.5 bg-primary"></span> Actual Revenue
                </span>
                <span className="flex items-center gap-1.5 text-cyan-light">
                  <span className="w-3 h-0.5 bg-cyan-light border-dashed"></span> Forecast ({forecastData.forecastDays} days)
                </span>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastData.combinedCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    formatter={(val, name) => [val ? `₹${Number(val).toLocaleString('en-IN')}` : 'N/A', name === 'actual_sales' ? 'Actual Sales' : 'Predicted Forecast']}
                  />
                  <Line type="monotone" dataKey="actual_sales" stroke="#8b5cf6" strokeWidth={2.5} dot={false} connectNulls={false} />
                  <Line type="monotone" dataKey="forecast" stroke="#06b6d4" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 3, fill: '#06b6d4' }} connectNulls={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Feature Importance & Forecast Table */}
        {forecastData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature Importance */}
            <div className="bi-card">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <BarChart2 size={18} className="text-primary-light" />
                Feature Importance (Top Predictors)
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={forecastData.featureImportance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="feature" stroke="#94a3b8" tick={{ fontSize: 11 }} width={110} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    />
                    <Bar dataKey="importance" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Forecast Table Preview */}
            <div className="bi-card flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar size={18} className="text-cyan-light" />
                  Predicted Daily Revenue ({forecastData.forecast?.length || 0} Days)
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Total: ₹{forecastData.summary?.totalPredictedRevenue?.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="overflow-y-auto max-h-64 border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 sticky top-0 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5">Forecast Date</th>
                      <th className="px-4 py-2.5 text-right">Predicted Revenue</th>
                      <th className="px-4 py-2.5 text-right">Lower Bound</th>
                      <th className="px-4 py-2.5 text-right">Upper Bound</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {forecastData.forecast && forecastData.forecast.map((f) => (
                      <tr key={f.date} className="hover:bg-slate-800/40">
                        <td className="px-4 py-2 font-mono font-medium text-slate-300">{f.date}</td>
                        <td className="px-4 py-2 text-right font-bold text-cyan-light">₹{f.forecast.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-2 text-right font-mono text-slate-400">₹{f.lower_bound?.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-2 text-right font-mono text-slate-400">₹{f.upper_bound?.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Forecasting;
