import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BarChart3, Lock, Mail, User, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Manager');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isRegistering) {
      const result = await register(name, email, password, role);
      setLoading(false);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } else {
      const result = await login(email, password);
      setLoading(false);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@salesiq.com');
    setPassword('admin123');
    setIsRegistering(false);
  };

  const fillDemoManager = () => {
    setEmail('manager@salesiq.com');
    setPassword('manager123');
    setIsRegistering(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glow Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-light/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-card/90 border border-slate-800 rounded-2xl p-8 shadow-card backdrop-blur-xl relative z-10">
        {/* Header Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-primary to-cyan-light rounded-2xl mx-auto flex items-center justify-center shadow-glow mb-3">
            <BarChart3 className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">SalesIQ Platform</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">Intelligent Sales Analytics & Forecasting Platform</p>
        </div>

        {/* Quick Demo Accounts Buttons */}
        <div className="mb-6 p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <ShieldCheck size={13} className="text-primary-light" /> Quick Demo One-Click Login
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="py-1.5 px-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-xs font-semibold text-primary-light transition-all text-left flex items-center justify-between"
            >
              <span>Admin Demo</span>
              <CheckCircle2 size={13} />
            </button>
            <button
              type="button"
              onClick={fillDemoManager}
              className="py-1.5 px-3 bg-cyan/10 hover:bg-cyan/20 border border-cyan/30 rounded-lg text-xs font-semibold text-cyan-light transition-all text-left flex items-center justify-between"
            >
              <span>Manager Demo</span>
              <CheckCircle2 size={13} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="bi-input pl-10 w-full"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@salesiq.com"
                className="bi-input pl-10 w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bi-input pl-10 w-full"
              />
            </div>
          </div>

          {isRegistering && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="bi-input w-full"
              >
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bi-btn-primary w-full mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Authenticating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {isRegistering ? 'Create Account' : 'Sign In to Dashboard'}
                <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className="text-xs text-slate-400 hover:text-primary-light font-medium transition-colors"
          >
            {isRegistering 
              ? 'Already have an account? Sign In' 
              : "Don't have an account? Register new manager"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
