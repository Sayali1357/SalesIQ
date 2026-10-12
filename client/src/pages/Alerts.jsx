import React, { useState, useEffect } from 'react';
import ML_API from '../services/mlApi';
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
  TrendingDown,
  Wifi,
  WifiOff
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
import { defaultAlertsData } from '../services/mockData';

const ALERT_COLORS = {
  'Critical': '#ef4444',
  'Warning': '#f59e0b',
  'Info': '#3b82f6'
};

const Alerts = () => {
  const [loading, setLoading] = useState(false);
  const [runningCheck, setRunningCheck] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('All');
  const [showResolved, setShowResolved] = useState(true);
  
  // Resilient initial state ensuring cards and charts display immediately
  const [alertData, setAlertData] = useState(defaultAlertsData);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data } = await ML_API.get('/alerts');
      if (data && data.alerts) {
        setAlertData(data);
        setIsLiveConnected(true);
      }
    } catch (error) {
      console.warn('Alerts service deferred, showing cached anomalies:', error);
      setIsLiveConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCheck = async () => {
    setRunningCheck(true);
    try {
      const { data } = await ML_API.post('/alerts/generate');
      if (data && data.alerts) {
        setAlertData(prev => ({
          ...prev,
          alerts: data.alerts
        }));
        setIsLiveConnected(true);
      }
      fetchAlerts();
    } catch (error) {
      console.warn('Error generating live alerts:', error);
      setIsLiveConnected(false);
    } finally {
      setRunningCheck(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await ML_API.patch(`/alerts/${id}/resolve`);
      fetchAlerts();
    } catch (error) {
      // Local optimistic update
      setAlertData(prev => ({
        ...prev,
        alerts: prev.alerts.map(a => (a._id === id || a.id === id) ? { ...a, resolved: true } : a),
        summary: {
          ...prev.summary,
          resolved: (prev.summary.resolved || 0) + 1
        }
      }));
    }
  };

  const handleDelete = async (id) => {
    try {
      await ML_API.delete(`/alerts/${id}`);
      fetchAlerts();
    } catch (error) {
      // Local optimistic update
      setAlertData(prev => ({
        ...prev,
        alerts: prev.alerts.filter(a => a._id !== id && a.id !== id),
        summary: {
          ...prev.summary,
          totalAlerts: Math.max(0, (prev.summary.totalAlerts || 1) - 1)
        }
      }));
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
    const typeName = a.alertType || 'Operational';
    typeCounts[typeName] = (typeCounts[typeName] || 0) + 1;
  });
  
  let pieData = Object.keys(typeCounts).map(type => ({
    name: type,
    value: typeCounts[type]
  }));

  if (pieData.length === 0) {
    pieData = [
      { name: 'Out of Stock', value: 1 },
      { name: 'Revenue Drop', value: 1 },
      { name: 'Low Stock', value: 1 },
      { name: 'Return Rate', value: 1 }
    ];
  }

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

          <div className="flex flex-wrap items-center gap-3">
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
                  <span>Live Stream</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                  <WifiOff size={12} />
                  <span>Baseline Rules</span>
                </>
              )}
            </span>

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
            <h3 className="text-3xl font-extrabold text-white mt-1">{alertData.summary?.totalAlerts || 0}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Logged Anomalies</p>
          </div>

          <div className="bi-card border-l-4 border-l-rose-500">
            <p className="text-xs font-semibold text-rose-400 uppercase">Critical</p>
            <h3 className="text-3xl font-extrabold text-rose-400 mt-1">{alertData.summary?.critical || 0}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Action Required</p>
          </div>

          <div className="bi-card border-l-4 border-l-amber-500">
            <p className="text-xs font-semibold text-amber-400 uppercase">Warnings</p>
            <h3 className="text-3xl font-extrabold text-amber-400 mt-1">{alertData.summary?.warning || 0}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Threshold Exceeded</p>
          </div>

          <div className="bi-card border-l-4 border-l-emerald-500">
            <p className="text-xs font-semibold text-emerald-400 uppercase">Resolved</p>
            <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">{alertData.summary?.resolved || 0}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Closed Alerts</p>
          </div>
        </div>

        {/* Visual Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alert Type Distribution */}
          <div className="bi-card min-w-0">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <PieIcon size={18} className="text-cyan-light" />
              Alert Type Distribution
            </h3>
            <div className="h-60 w-full min-h-[240px] min-w-0" style={{ minHeight: '240px' }}>
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240} debounce={50}>
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
              )}
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
                  className="rounded bg-slate-900 border-slate-700 text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="showResolved" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Include Resolved Alerts in List
                </label>
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs text-slate-400 mt-4">
              <span className="font-semibold text-slate-300">Automated Rules:</span> Runs scans on inventory &le; reorderLevel, revenue &lt; 7-day average by 20%+, and return rate &gt; 15%.
            </div>
          </div>
        </div>

        {/* Active Alerts List */}
        <div className="bi-card">
          <h3 className="text-base font-bold text-white mb-4">
            Alert Feed ({filteredAlerts.length})
          </h3>

          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No alerts match the selected criteria.
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert._id || alert.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    alert.resolved 
                      ? 'bg-slate-900/40 border-slate-800/60 opacity-60' 
                      : alert.severity === 'Critical'
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : alert.severity === 'Warning'
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-blue-500/10 border-blue-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 mt-0.5">
                      {alert.severity === 'Critical' ? (
                        <AlertOctagon size={18} className="text-rose-400" />
                      ) : alert.severity === 'Warning' ? (
                        <AlertTriangle size={18} className="text-amber-400" />
                      ) : (
                        <Info size={18} className="text-blue-400" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          alert.severity === 'Critical'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : alert.severity === 'Warning'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}>
                          {alert.severity}
                        </span>
                        <h4 className="text-sm font-bold text-white">{alert.title}</h4>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{alert.message}</p>
                      <span className="text-[10px] text-slate-500 mt-2 block font-mono">
                        Logged: {new Date(alert.createdAt || Date.now()).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!alert.resolved && (
                      <button
                        onClick={() => handleResolve(alert._id || alert.id)}
                        className="px-3 py-1.5 text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 size={14} /> Resolve
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(alert._id || alert.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete Alert"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Alerts;
