import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import { 
  BellRing, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  CheckCircle2, 
  Trash2, 
  Play, 
  Filter, 
  PieChart as PieIcon,
  TrendingDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

const ALERT_COLORS = {
  'Critical': '#ef4444',
  'Warning': '#f59e0b',
  'Info': '#3b82f6'
};

const Alerts = () => {
  const [loading, setLoading] = useState(true);
  const [runningCheck, setRunningCheck] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('All');
  const [showResolved, setShowResolved] = useState(true);
  const [alertData, setAlertData] = useState({
    summary: { totalAlerts: 0, critical: 0, warning: 0, info: 0, resolved: 0 },
    alerts: []
  });

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/alerts');
      if (data) setAlertData(data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCheck = async () => {
    setRunningCheck(true);
    try {
      const { data } = await API.post('/alerts/generate');
      if (data && data.alerts) {
        setAlertData(prev => ({
          ...prev,
          alerts: data.alerts
        }));
      }
      fetchAlerts();
    } catch (error) {
      console.error('Error generating alerts:', error);
    } finally {
      setRunningCheck(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await API.patch(`/alerts/${id}/resolve`);
      fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/alerts/${id}`);
      fetchAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const filteredAlerts = alertData.alerts.filter((a) => {
    const matchesSev = severityFilter === 'All' || a.severity === severityFilter;
    const matchesRes = showResolved ? true : !a.resolved;
    return matchesSev && matchesRes;
  });

  // Alert Type Distribution for Pie Chart
  const typeCounts = {};
  alertData.alerts.forEach(a => {
    typeCounts[a.alertType] = (typeCounts[a.alertType] || 0) + 1;
  });
  const pieData = Object.keys(typeCounts).map(type => ({
    name: type,
    value: typeCounts[type]
  }));

  const PIE_COLORS = ['#ec4899', '#f59e0b', '#06b6d4', '#8b5cf6'];

  return (
    <div className="flex-1 overflow-y-auto bg-background min-h-screen">
      <Navbar title="KPI Monitoring & Alerts" subtitle="Automated threshold monitoring with real-time alert detection" />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <BellRing size={24} className="text-rose-400" />
              Real-Time Automated Alert Engine
            </h1>
            <p className="text-xs text-slate-400">Rule-based anomaly detection across sales revenue, return rates & inventory levels</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunCheck}
              disabled={runningCheck}
              className="bi-btn-primary text-xs py-2.5 px-4 shadow-glow"
            >
              {runningCheck ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Scanning Thresholds...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Play size={15} /> Run KPI Check
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 4 Alert Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bi-card">
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Alerts</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">{alertData.summary.totalAlerts}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Logged Anomalies</p>
          </div>

          <div className="bi-card border-l-4 border-l-rose-500">
            <p className="text-xs font-semibold text-rose-400 uppercase">Critical</p>
            <h3 className="text-3xl font-extrabold text-rose-400 mt-1">{alertData.summary.critical}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Action Required</p>
          </div>

          <div className="bi-card border-l-4 border-l-amber-500">
            <p className="text-xs font-semibold text-amber-400 uppercase">Warnings</p>
            <h3 className="text-3xl font-extrabold text-amber-400 mt-1">{alertData.summary.warning}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Threshold Exceeded</p>
          </div>

          <div className="bi-card border-l-4 border-l-emerald-500">
            <p className="text-xs font-semibold text-emerald-400 uppercase">Resolved</p>
            <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">{alertData.summary.resolved}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Closed Alerts</p>
          </div>
        </div>

        {/* Visual Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alert Type Distribution */}
          <div className="bi-card">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <PieIcon size={18} className="text-cyan-light" />
              Alert Type Distribution
            </h3>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Severity Filters & Controls */}
          <div className="bi-card flex flex-col justify-between">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Filter size={18} className="text-primary-light" />
              Alert Filter Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Severity Filter</label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="bi-input w-full"
                >
                  <option value="All">All Severities</option>
                  <option value="Critical">Critical Only</option>
                  <option value="Warning">Warning Only</option>
                  <option value="Info">Information Only</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="showResolved"
                  checked={showResolved}
                  onChange={(e) => setShowResolved(e.target.checked)}
                  className="accent-primary w-4 h-4 rounded"
                />
                <label htmlFor="showResolved" className="text-sm font-medium text-slate-300 cursor-pointer">
                  Show Resolved Alerts in List
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BellRing size={18} className="text-primary-light" />
            Alert Logs & Resolution Center
          </h3>

          {filteredAlerts.length === 0 ? (
            <div className="bi-card p-12 text-center text-slate-400">
              <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2" />
              No active alerts matching filter. All business thresholds within normal limits!
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div 
                key={alert._id} 
                className={`bi-card border-l-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                  alert.resolved ? 'opacity-60 bg-slate-900/40 border-l-slate-600' : 
                  alert.severity === 'Critical' ? 'border-l-rose-500 bg-rose-950/10' :
                  alert.severity === 'Warning' ? 'border-l-amber-500 bg-amber-950/10' : 'border-l-blue-500 bg-blue-950/10'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {alert.severity === 'Critical' && <AlertOctagon size={22} className="text-rose-400" />}
                    {alert.severity === 'Warning' && <AlertTriangle size={22} className="text-amber-400" />}
                    {alert.severity === 'Info' && <Info size={22} className="text-blue-400" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        alert.severity === 'Critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                        alert.severity === 'Warning' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">{alert.alertType}</span>
                    </div>

                    <h4 className="text-base font-bold text-white mt-1">{alert.title}</h4>
                    <p className="text-xs text-slate-300 mt-0.5">{alert.message}</p>
                    <p className="text-[11px] text-slate-400 mt-2 font-mono">
                      Logged: {new Date(alert.createdAt).toLocaleString()}
                      {alert.resolved && ` • Resolved at ${new Date(alert.resolvedAt).toLocaleString()}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {!alert.resolved && (
                    <button
                      onClick={() => handleResolve(alert._id)}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                    >
                      <CheckCircle2 size={14} /> Resolve
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(alert._id)}
                    className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                    title="Delete Alert Log"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Alerts;
