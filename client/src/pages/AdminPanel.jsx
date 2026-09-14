import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import { 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Database, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Key, 
  Plus,
  RefreshCw,
  Server
} from 'lucide-react';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Manager');
  const [error, setError] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [uRes, sRes] = await Promise.all([
        API.get('/users'),
        API.get('/admin/statistics')
      ]);
      if (uRes.data) setUsers(uRes.data);
      if (sRes.data) setStats(sRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post('/users', { name, email, password, role });
      setName('');
      setEmail('');
      setPassword('');
      setRole('Manager');
      setShowAddModal(false);
      fetchAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await API.put(`/users/${user._id}`, { active: !user.active });
      fetchAdminData();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to remove this user account?')) return;
    try {
      await API.delete(`/users/${id}`);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background min-h-screen">
      <Navbar title="Admin Panel & Database Management" subtitle="System administration, role management, and database metrics (Admin Restricted)" />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck size={24} className="text-primary-light" />
              Administrative Control Center
            </h1>
            <p className="text-xs text-slate-400">Manage user access permissions, manager accounts & inspect database telemetry</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="bi-btn-primary text-xs py-2.5 px-4"
            >
              <UserPlus size={16} /> Add Manager Account
            </button>
            <button
              onClick={fetchAdminData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Database Metric Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bi-card">
              <p className="text-xs font-semibold text-slate-400 uppercase">System Users</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.totalUsers}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Admin & Managers</p>
            </div>

            <div className="bi-card">
              <p className="text-xs font-semibold text-slate-400 uppercase">Customers</p>
              <h3 className="text-2xl font-bold text-cyan-light mt-1">{stats.totalCustomers}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Registered Records</p>
            </div>

            <div className="bi-card">
              <p className="text-xs font-semibold text-slate-400 uppercase">Products</p>
              <h3 className="text-2xl font-bold text-primary-light mt-1">{stats.totalProducts}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Catalog Items</p>
            </div>

            <div className="bi-card">
              <p className="text-xs font-semibold text-slate-400 uppercase">Total Orders</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{stats.totalOrders}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Order Transactions</p>
            </div>

            <div className="bi-card">
              <p className="text-xs font-semibold text-slate-400 uppercase">Total Revenue</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">
                ₹{stats.totalRevenue ? stats.totalRevenue.toLocaleString('en-IN') : '12,50,000'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Aggregate Sales</p>
            </div>
          </div>
        )}

        {/* User Management Section */}
        <div className="bi-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users size={18} className="text-primary-light" />
              User Access & Role Management
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">User Name</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3 text-center">Role</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 text-primary-light font-bold text-xs flex items-center justify-center border border-primary/30">
                        {u.name.charAt(0)}
                      </div>
                      {u.name}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">{u.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        u.role === 'Admin' 
                          ? 'bg-primary/20 text-primary-light border border-primary/40' 
                          : 'bg-cyan/20 text-cyan-light border border-cyan/40'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center justify-center gap-1 mx-auto ${
                          u.active !== false
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {u.active !== false ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {u.active !== false ? 'Active' : 'Deactivated'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                        title="Remove User"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Database Collections Telemetry */}
        {stats && stats.collections && (
          <div className="bi-card">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Database size={18} className="text-emerald-400" />
              MongoDB Database Collections Status
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              {stats.collections.map((col) => (
                <div key={col.name} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-center">
                  <p className="text-xs font-semibold text-slate-400">{col.name}</p>
                  <h4 className="text-xl font-bold text-white mt-1">{col.count}</h4>
                  <span className="text-[10px] text-emerald-400 font-medium">{col.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Manager Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bi-card w-full max-w-md bg-card border-slate-700 p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus className="text-primary-light" size={20} />
                  Add Manager Account
                </h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sarah Manager"
                    className="bi-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@salesiq.com"
                    className="bi-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bi-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="bi-input w-full"
                  >
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="bi-btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bi-btn-primary text-xs"
                  >
                    Create User Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
