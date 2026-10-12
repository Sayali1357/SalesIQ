import React, { useState, useEffect } from 'react';
import ML_API from '../services/mlApi';
import Navbar from '../components/Navbar';
import { 
  Users, 
  Target, 
  Crown, 
  Flame, 
  AlertTriangle, 
  UserX, 
  Search, 
  Filter, 
  ScatterChart as ScatterIcon,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell
} from 'recharts';
import { generateDefaultSegmentation } from '../services/mockData';
import { getCached, setCached } from '../services/cache';

const SEGMENT_COLORS = {
  'Champions': '#8b5cf6',       // Purple
  'Loyal Customers': '#06b6d4', // Cyan
  'Potential Loyalists': '#10b981', // Green
  'At Risk': '#f59e0b',        // Yellow/Amber
  'Lost Customers': '#ef4444',   // Red
  'Need Attention': '#6366f1'   // Indigo
};

const CustomerSegmentation = () => {
  const [nClusters, setNClusters] = useState(4);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Initialize with complete fallback segmentation so PCA scatter plot renders immediately
  const [segmentData, setSegmentData] = useState(() => 
    getCached('seg_4') || generateDefaultSegmentation(4)
  );

  // Table filters
  const [search, setSearch] = useState('');
  const [selectedSegmentFilter, setSelectedSegmentFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchSegmentation = async (forceRefresh = false) => {
    const cacheKey = `seg_${nClusters}`;
    const cached = getCached(cacheKey);
    if (!forceRefresh && cached) {
      setSegmentData(cached);
      return;
    }

    setLoading(true);
    try {
      const { data } = await ML_API.get(`/customers/segments?nClusters=${nClusters}`);
      if (data && data.pcaPoints && data.pcaPoints.length > 0) {
        setSegmentData(data);
        setCached(cacheKey, data);
        setIsLiveConnected(true);
      } else {
        const fallback = generateDefaultSegmentation(nClusters);
        setSegmentData(fallback);
      }
    } catch (error) {
      console.warn('Customer segmentation live API deferred, using calculated cohort model:', error);
      setIsLiveConnected(false);
      const fallback = generateDefaultSegmentation(nClusters);
      setSegmentData(fallback);
      setCached(cacheKey, fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegmentation();
  }, [nClusters]);

  // Filtering Customer Table
  const filteredCustomers = (segmentData?.customers || []).filter((cust) => {
    const matchesSearch = cust.customerId.toLowerCase().includes(search.toLowerCase());
    const matchesSeg = selectedSegmentFilter === 'All' || cust.segment === selectedSegmentFilter;
    return matchesSearch && matchesSeg;
  });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getSegmentIcon = (name) => {
    switch(name) {
      case 'Champions': return <Crown className="text-purple-400" size={20} />;
      case 'Loyal Customers': return <Flame className="text-cyan-400" size={20} />;
      case 'At Risk': return <AlertTriangle className="text-amber-400" size={20} />;
      case 'Lost Customers': return <UserX className="text-rose-400" size={20} />;
      default: return <Users className="text-slate-400" size={20} />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background min-h-screen">
      <Navbar title="Customer Segmentation (RFM Analysis)" subtitle="Segments customers using Recency, Frequency & Monetary value with KMeans clustering" />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Controls Bar */}
        <div className="bi-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Target className="text-primary-light" size={22} />
              K-Means Clustering Parameters
            </h2>
            <p className="text-xs text-slate-400">Dynamically scale features and partition customer cohorts</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
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
                  <span>Cohort Simulation</span>
                </>
              )}
            </span>

            <label className="text-xs font-semibold text-slate-300">Clusters (K):</label>
            <input
              type="range"
              min="2"
              max="6"
              value={nClusters}
              onChange={(e) => setNClusters(parseInt(e.target.value))}
              className="accent-primary cursor-pointer h-2 bg-slate-800 rounded-lg w-32"
            />
            <span className="text-sm font-bold text-primary-light w-6">{nClusters}</span>
            <button
              onClick={fetchSegmentation}
              className="bi-btn-primary text-xs py-2 px-3"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Recalculate
            </button>
          </div>
        </div>

        {/* Segment Summary Cards */}
        {segmentData && segmentData.segmentsSummary && (
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Segment Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {segmentData.segmentsSummary.map((seg) => (
                <div 
                  key={seg.segmentName}
                  className="bi-card relative border-t-4" 
                  style={{ borderTopColor: seg.color }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      {getSegmentIcon(seg.segmentName)}
                      {seg.segmentName}
                    </span>
                  </div>

                  <div className="my-2">
                    <h3 className="text-3xl font-extrabold text-white">{seg.customerCount}</h3>
                    <p className="text-xs text-slate-400 font-medium">customers</p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-800/80 space-y-1 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Avg Recency:</span>
                      <span className="font-semibold text-slate-200">{seg.avgRecency} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Orders:</span>
                      <span className="font-semibold text-slate-200">{seg.avgFrequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Spend:</span>
                      <span className="font-semibold text-emerald-400">₹{seg.avgMonetary.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PCA Cluster Scatter Plot */}
        {segmentData && segmentData.pcaPoints && (
          <div className="bi-card min-w-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ScatterIcon size={18} className="text-primary-light" />
                  2D Principal Component Analysis (PCA Cluster Map)
                </h3>
                <p className="text-xs text-slate-400">Visualization of standardized RFM vector space mapped onto 2 principal components</p>
              </div>
            </div>

            <div className="h-80 w-full min-h-[320px] min-w-0" style={{ minHeight: '320px' }}>
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={320} debounce={50}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" dataKey="pca1" name="PCA Component 1" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis type="number" dataKey="pca2" name="PCA Component 2" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                      formatter={(val, name, item) => {
                        if (name === 'PCA Component 1' || name === 'PCA Component 2') return [val, name];
                        return [`₹${item.payload.monetary} (R:${item.payload.recency}d, F:${item.payload.frequency})`, item.payload.segment];
                      }}
                    />
                    <Scatter name="Customers" data={segmentData.pcaPoints} fill="#8b5cf6">
                      {segmentData.pcaPoints.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SEGMENT_COLORS[entry.segment] || '#3b82f6'} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Customer RFM Table */}
        {segmentData && (
          <div className="bi-card">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-cyan-light" />
                Customer RFM Metrics Table
              </h3>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Search */}
                <div className="relative flex items-center flex-1 md:w-64">
                  <Search className="absolute left-3 text-slate-400 w-4 h-4 pointer-events-none z-10" />
                  <input
                    type="text"
                    placeholder="Search Customer ID..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bi-input pl-9 text-xs w-full py-1.5"
                  />
                </div>

                {/* Segment Filter */}
                <select
                  value={selectedSegmentFilter}
                  onChange={(e) => {
                    setSelectedSegmentFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bi-input text-xs py-1.5 px-3"
                >
                  <option value="All">All Cohorts</option>
                  <option value="Champions">Champions</option>
                  <option value="Loyal Customers">Loyal Customers</option>
                  <option value="At Risk">At Risk</option>
                  <option value="Lost Customers">Lost Customers</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Customer ID</th>
                    <th className="px-4 py-3">Segment</th>
                    <th className="px-4 py-3 text-right">Recency (Days)</th>
                    <th className="px-4 py-3 text-right">Frequency (Orders)</th>
                    <th className="px-4 py-3 text-right">Monetary Spend</th>
                    <th className="px-4 py-3 text-center">Cluster</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedCustomers.map((cust) => (
                    <tr key={cust.customerId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-white">{cust.customerId}</td>
                      <td className="px-4 py-3">
                        <span 
                          className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{ 
                            backgroundColor: `${SEGMENT_COLORS[cust.segment]}20`, 
                            color: SEGMENT_COLORS[cust.segment],
                            border: `1px solid ${SEGMENT_COLORS[cust.segment]}40`
                          }}
                        >
                          {cust.segment}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">{cust.recency}d</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">{cust.frequency}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                        ₹{Number(cust.monetary).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
                          #{cust.cluster}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
              <span>Showing {paginatedCustomers.length} of {filteredCustomers.length} customers</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded text-slate-200"
                >
                  Previous
                </button>
                <span className="font-semibold text-slate-200">Page {currentPage} of {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded text-slate-200"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerSegmentation;
