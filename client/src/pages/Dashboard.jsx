import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  CreditCard, 
  TrendingUp, 
  PieChart as PieIcon, 
  MapPin, 
  Globe, 
  Award,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#3b82f6'];

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30 days');
  const [overview, setOverview] = useState({
    totalRevenue: 1250000,
    revenueGrowth: 12.5,
    totalOrders: 5248,
    ordersGrowth: 8.2,
    totalCustomers: 487,
    customersGrowth: 5.4,
    avgOrderValue: 2381,
    aovGrowth: 3.1
  });

  const [revenueTrend, setRevenueTrend] = useState([]);
  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [channels, setChannels] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [dataLastUpdated, setDataLastUpdated] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ovRes, trendRes, catRes, regRes, chanRes, topRes] = await Promise.all([
        API.get('/dashboard/overview'),
        API.get('/dashboard/revenue-trend'),
        API.get('/dashboard/categories'),
        API.get('/dashboard/regions'),
        API.get('/dashboard/channels'),
        API.get('/dashboard/top-products')
      ]);

      if (ovRes.data) setOverview(ovRes.data);
      if (trendRes.data) setRevenueTrend(trendRes.data);
      if (catRes.data) setCategories(catRes.data);
      if (regRes.data) setRegions(regRes.data);
      if (chanRes.data) setChannels(chanRes.data);
      if (topRes.data) setTopProducts(topRes.data);

      // Fetch data freshness status
      try {
        const dsRes = await API.get('/data/datasets');
        if (dsRes.data?.datasets) {
          const latestModified = dsRes.data.datasets
            .map(d => d.lastModified)
            .filter(Boolean)
            .sort()
            .pop();
          if (latestModified) setDataLastUpdated(latestModified);
        }
      } catch (dsErr) {
        // Non-critical, ignore
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  return (
    <div className="flex-1 overflow-y-auto bg-background min-h-screen">
      <Navbar title="Sales Dashboard" subtitle="Real-time business performance analytics and key indicators" />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Top Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="p-2 bg-primary/20 text-primary-light rounded-xl border border-primary/30">
                <TrendingUp size={22} />
              </span>
              Key Performance Indicators
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {dataLastUpdated && (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium hidden sm:inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                Data: {new Date(dataLastUpdated).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </span>
            )}
            <label className="text-xs text-slate-400 font-medium">Period:</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bi-input text-xs py-1.5 px-3"
            >
              <option value="7 days">7 days</option>
              <option value="30 days">30 days</option>
              <option value="90 days">90 days</option>
              <option value="365 days">365 days</option>
            </select>
            <button
              onClick={fetchData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
              title="Refresh Analytics"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* 4 Main KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Revenue"
            value={`₹${overview.totalRevenue.toLocaleString('en-IN')}`}
            change={overview.revenueGrowth}
            isPositive={overview.revenueGrowth >= 0}
            icon={DollarSign}
            subtitle="vs previous period"
          />
          <StatCard
            title="Total Orders"
            value={overview.totalOrders.toLocaleString('en-IN')}
            change={overview.ordersGrowth}
            isPositive={overview.ordersGrowth >= 0}
            icon={ShoppingBag}
            subtitle="vs previous period"
          />
          <StatCard
            title="Total Customers"
            value={overview.totalCustomers.toLocaleString('en-IN')}
            change={overview.customersGrowth}
            isPositive={overview.customersGrowth >= 0}
            icon={Users}
            subtitle="vs previous period"
          />
          <StatCard
            title="Avg Order Value"
            value={`₹${overview.avgOrderValue.toLocaleString('en-IN')}`}
            change={overview.aovGrowth}
            isPositive={overview.aovGrowth >= 0}
            icon={CreditCard}
            subtitle="vs previous period"
          />
        </div>

        {/* Daily Revenue Trend & Category Breakdown Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trend Line Chart */}
          <div className="bi-card lg:col-span-2 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-primary-light" />
                Daily Revenue Trend
              </h3>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-primary-light">
                  <span className="w-3 h-0.5 bg-primary"></span> Revenue
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-3 h-0.5 bg-amber-400"></span> 7-Day Moving Avg
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="movingAverage" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue by Category Pie Chart */}
          <div className="bi-card flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PieIcon size={18} className="text-cyan-light" />
                Revenue by Category
              </h3>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="revenue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Region & Channel Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sales by Region */}
          <div className="bi-card">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-emerald-400" />
              Sales by Region
            </h3>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regions} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="region" stroke="#94a3b8" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales by Channel */}
          <div className="bi-card">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Globe size={18} className="text-primary-light" />
              Sales Channels
            </h3>
            <div className="space-y-4">
              {channels.map((chan, idx) => (
                <div key={chan.channel} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>{chan.channel}</span>
                    <span>₹{chan.revenue.toLocaleString('en-IN')} ({chan.percentage}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${chan.percentage}%`,
                        backgroundColor: COLORS[idx % COLORS.length] 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Performing Products Table */}
        <div className="bi-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award size={18} className="text-amber-400" />
              Top Performing Products
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Units Sold</th>
                  <th className="px-4 py-3 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {topProducts.map((prod) => (
                  <tr key={prod.productId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-primary-light">#{prod.rank}</td>
                    <td className="px-4 py-3 font-semibold text-white">{prod.productName}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {prod.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium">{prod.unitsSold}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400">
                      ₹{prod.revenue.toLocaleString('en-IN')}
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

export default Dashboard;
