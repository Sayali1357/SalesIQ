import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import Navbar from '../components/Navbar';
import {
  DatabaseZap,
  Upload,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  HardDrive,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trash2,
  Eye,
  Zap,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Sparkles,
  Table,
  UploadCloud,
  FilePlus2
} from 'lucide-react';

const DATASET_TYPES = [
  {
    key: 'ecommerce_sales',
    label: 'E-Commerce Sales Data',
    description: 'Core transactional data: orders, products, customers, regions',
    color: '#8b5cf6',
    powers: ['Dashboard', 'Recommendations', 'Inventory']
  },
  {
    key: 'daily_sales_features',
    label: 'Daily Sales Features',
    description: 'Aggregated daily revenue with lag & rolling features',
    color: '#06b6d4',
    powers: ['Sales Forecasting']
  },
  {
    key: 'customer_segments',
    label: 'Customer Segments (RFM)',
    description: 'Customer Recency, Frequency, Monetary data',
    color: '#10b981',
    powers: ['Customer Segmentation']
  }
];

const DataManagement = () => {
  const [datasets, setDatasets] = useState([]);
  const [mlStatus, setMlStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDatasetType, setSelectedDatasetType] = useState('ecommerce_sales');
  const [uploadResult, setUploadResult] = useState(null);
  const [retrainResult, setRetrainResult] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(null);
  const [addRowsOpen, setAddRowsOpen] = useState(false);
  const [rowFormData, setRowFormData] = useState({});
  const [addingRows, setAddingRows] = useState(false);
  const fileInputRef = useRef(null);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/data/datasets');
      if (data.datasets) setDatasets(data.datasets);
      if (data.mlStatus) setMlStatus(data.mlStatus);
    } catch (err) {
      console.error('Error fetching datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setError('');
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('datasetType', selectedDatasetType);

    try {
      const { data } = await API.post('/data/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      });
      setUploadResult(data);
      fetchDatasets();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      handleFileUpload(file);
    } else {
      setError('Only CSV files are accepted.');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file);
  };

  const handleRetrain = async (datasetType = 'all') => {
    setRetraining(true);
    setRetrainResult(null);
    setError('');
    try {
      const { data } = await API.post('/data/retrain', { datasetType }, { timeout: 120000 });
      setRetrainResult(data);
      fetchDatasets();
    } catch (err) {
      setError(err.response?.data?.message || 'Re-training failed. Is the ML service running?');
    } finally {
      setRetraining(false);
    }
  };

  const handlePreview = async (datasetName) => {
    if (previewOpen === datasetName) {
      setPreviewOpen(null);
      setPreviewData(null);
      return;
    }
    try {
      const { data } = await API.get(`/data/preview/${datasetName}`);
      setPreviewData(data);
      setPreviewOpen(datasetName);
    } catch (err) {
      setError('Failed to load preview');
    }
  };

  const handleDeleteDataset = async (datasetName) => {
    if (!window.confirm(`Are you sure you want to remove "${datasetName}"? A backup will be saved.`)) return;
    try {
      await API.delete(`/data/${datasetName}`);
      fetchDatasets();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleAddRows = async () => {
    setAddingRows(true);
    setError('');
    try {
      const { data } = await API.post('/data/add-rows', {
        datasetType: selectedDatasetType,
        rows: [rowFormData]
      });
      setUploadResult(data);
      setRowFormData({});
      setAddRowsOpen(false);
      fetchDatasets();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add row');
    } finally {
      setAddingRows(false);
    }
  };

  const getDatasetMeta = (key) => DATASET_TYPES.find(d => d.key === key) || DATASET_TYPES[0];

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const selectedMeta = getDatasetMeta(selectedDatasetType);
  const selectedDataset = datasets.find(d => d.name === selectedDatasetType);

  return (
    <div className="flex-1 overflow-y-auto bg-background min-h-screen">
      <Navbar title="Data Management" subtitle="Upload datasets, manage data, and retrain ML models dynamically" />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <DatabaseZap size={22} />
              </span>
              Data & Model Pipeline
            </h1>
            <p className="text-xs text-slate-400 mt-1">Upload new CSV files or add data rows — ML models retrain automatically</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleRetrain('all')}
              disabled={retraining}
              className="bi-btn-primary text-xs py-2.5 px-4"
            >
              {retraining ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Re-training All Models...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <BrainCircuit size={16} /> Retrain All Models
                </span>
              )}
            </button>
            <button
              onClick={fetchDatasets}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-sm text-rose-400 flex items-start gap-3">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
            <button onClick={() => setError('')} className="ml-auto text-rose-400 hover:text-rose-300">
              <XCircle size={16} />
            </button>
          </div>
        )}

        {uploadResult && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm text-emerald-400 flex items-start gap-3">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Success</p>
              <p className="text-xs mt-0.5">{uploadResult.message}</p>
            </div>
            <button onClick={() => setUploadResult(null)} className="ml-auto text-emerald-400 hover:text-emerald-300">
              <XCircle size={16} />
            </button>
          </div>
        )}

        {retrainResult && (
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl text-sm text-primary-light flex items-start gap-3">
            <Sparkles size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">ML Models Re-trained</p>
              <p className="text-xs mt-0.5">{retrainResult.message}</p>
              {retrainResult.result?.results && (
                <div className="flex gap-3 mt-2 flex-wrap">
                  {Object.entries(retrainResult.result.results).map(([key, val]) => (
                    <span key={key} className="px-2 py-0.5 bg-slate-800 rounded text-[10px] font-mono border border-slate-700">
                      {key}: {val.status || 'done'}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setRetrainResult(null)} className="ml-auto text-primary-light hover:text-white">
              <XCircle size={16} />
            </button>
          </div>
        )}

        {/* Dataset Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {datasets.map((ds) => {
            const meta = getDatasetMeta(ds.name);
            return (
              <div key={ds.name} className="bi-card relative overflow-hidden group">
                {/* Glow accent bar */}
                <div className="absolute top-0 left-0 w-full h-1 rounded-t-xl" style={{ backgroundColor: meta.color }} />

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ backgroundColor: `${meta.color}20`, borderColor: `${meta.color}40` }}>
                      <FileSpreadsheet size={20} style={{ color: meta.color }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{meta.label}</h4>
                      <p className="text-[10px] text-slate-400">{meta.description}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    ds.fileExists ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}>
                    {ds.fileExists ? 'Active' : 'Missing'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center p-2 bg-slate-900/50 rounded-lg border border-slate-800">
                    <p className="text-lg font-extrabold text-white">{ds.rowCount?.toLocaleString() || 0}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Rows</p>
                  </div>
                  <div className="text-center p-2 bg-slate-900/50 rounded-lg border border-slate-800">
                    <p className="text-lg font-extrabold text-white">{ds.columns?.length || 0}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Columns</p>
                  </div>
                  <div className="text-center p-2 bg-slate-900/50 rounded-lg border border-slate-800">
                    <p className="text-lg font-extrabold text-white">{formatFileSize(ds.fileSize)}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Size</p>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} /> Last Modified: {formatDate(ds.lastModified)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BrainCircuit size={11} /> Last Retrained: {formatDate(ds.lastRetrained)}
                  </div>
                </div>

                {/* Powers tags */}
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {meta.powers.map(p => (
                    <span key={p} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      ⚡ {p}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handlePreview(ds.name)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors border border-slate-700"
                  >
                    <Eye size={13} /> {previewOpen === ds.name ? 'Close' : 'Preview'}
                  </button>
                  <button
                    onClick={() => handleRetrain(ds.name)}
                    disabled={retraining}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg transition-colors border"
                    style={{ backgroundColor: `${meta.color}15`, borderColor: `${meta.color}40`, color: meta.color }}
                  >
                    <Zap size={13} /> Retrain
                  </button>
                  <button
                    onClick={() => handleDeleteDataset(ds.name)}
                    className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors border border-slate-700"
                    title="Remove Dataset"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Preview table */}
                {previewOpen === ds.name && previewData && (
                  <div className="mt-4 border border-slate-800 rounded-lg overflow-x-auto max-h-48">
                    <table className="w-full text-left text-[11px] text-slate-300">
                      <thead className="bg-slate-900 sticky top-0 text-slate-400 font-semibold border-b border-slate-800">
                        <tr>
                          {previewData.headers?.map(h => (
                            <th key={h} className="px-2 py-1.5 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {previewData.rows?.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            {previewData.headers?.map(h => (
                              <td key={h} className="px-2 py-1.5 whitespace-nowrap font-mono">{row[h] || ''}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800 w-fit">
          {[
            { key: 'upload', label: 'Upload CSV', icon: UploadCloud },
            { key: 'addRows', label: 'Add Data Rows', icon: FilePlus2 }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-primary/20 text-white border border-primary/40 shadow-glow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Upload CSV Tab */}
        {activeTab === 'upload' && (
          <div className="bi-card border-primary/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload size={18} className="text-primary-light" />
                Upload CSV Dataset
              </h3>
              <span className="text-xs text-slate-400">Max 100MB • CSV format only</span>
            </div>

            {/* Dataset type selector */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-300 mb-2">Select Dataset Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DATASET_TYPES.map(ds => (
                  <button
                    key={ds.key}
                    onClick={() => setSelectedDatasetType(ds.key)}
                    className={`p-3 rounded-xl text-left transition-all border ${
                      selectedDatasetType === ds.key
                        ? 'bg-slate-800 border-primary/50 shadow-glow'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ds.color }} />
                      <span className="text-xs font-bold text-white">{ds.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{ds.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Required columns info */}
            {selectedDataset && (
              <div className="mb-5 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                <p className="text-[11px] font-semibold text-slate-300 mb-1.5">Required CSV Columns:</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDataset.requiredColumns?.map(col => (
                    <span key={col} className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-800 text-cyan-light border border-slate-700">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-primary bg-primary/10 scale-[1.01]'
                  : 'border-slate-700 hover:border-primary/50 hover:bg-slate-800/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-semibold text-white">Uploading & Processing...</p>
                  <p className="text-xs text-slate-400">Validating CSV, updating dataset, triggering ML retrain</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <UploadCloud size={28} className="text-primary-light" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Drag & drop your CSV file here</p>
                    <p className="text-xs text-slate-400 mt-1">or click to browse files</p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700" style={{ color: selectedMeta.color }}>
                      → {selectedMeta.label}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Data Rows Tab */}
        {activeTab === 'addRows' && (
          <div className="bi-card border-emerald-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FilePlus2 size={18} className="text-emerald-400" />
                Add Individual Data Rows
              </h3>
            </div>

            {/* Dataset type selector */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-300 mb-2">Select Dataset Type</label>
              <select
                value={selectedDatasetType}
                onChange={(e) => { setSelectedDatasetType(e.target.value); setRowFormData({}); }}
                className="bi-input w-full max-w-sm"
              >
                {DATASET_TYPES.map(ds => (
                  <option key={ds.key} value={ds.key}>{ds.label}</option>
                ))}
              </select>
            </div>

            {/* Dynamic form based on dataset schema */}
            {selectedDataset && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedDataset.requiredColumns?.map(col => (
                    <div key={col}>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">{col}</label>
                      <input
                        type="text"
                        value={rowFormData[col] || ''}
                        onChange={(e) => setRowFormData({ ...rowFormData, [col]: e.target.value })}
                        placeholder={`Enter ${col}`}
                        className="bi-input w-full text-xs"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleAddRows}
                    disabled={addingRows || Object.keys(rowFormData).length === 0}
                    className="bi-btn-primary text-xs py-2.5 px-6"
                  >
                    {addingRows ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Adding Row...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Plus size={14} /> Add Row & Retrain
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setRowFormData({})}
                    className="bi-btn-secondary text-xs py-2.5 px-4"
                  >
                    Clear Form
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ML Service Status */}
        <div className="bi-card">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <HardDrive size={18} className="text-cyan-light" />
            ML Service & Data Pipeline Status
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase">ML Service</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className={`w-2.5 h-2.5 rounded-full ${mlStatus ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className={`text-sm font-bold ${mlStatus ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {mlStatus ? 'Online' : 'Offline / Unavailable'}
                </span>
              </div>
            </div>

            {datasets.map(ds => {
              const meta = getDatasetMeta(ds.name);
              return (
                <div key={ds.name} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-center">
                  <p className="text-xs font-semibold text-slate-400 uppercase">{meta.label.split(' ').slice(0, 2).join(' ')}</p>
                  <h4 className="text-xl font-bold text-white mt-1">{ds.rowCount?.toLocaleString() || 0}</h4>
                  <p className="text-[10px] text-slate-400 mt-1">rows • {formatFileSize(ds.fileSize)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DataManagement;
