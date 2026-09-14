import React from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { User, ShieldCheck, Mail, Calendar, Key, CheckCircle2 } from 'lucide-react';

const UserProfile = () => {
  const { user } = useAuth();

  return (
    <div className="flex-1 overflow-y-auto bg-background min-h-screen">
      <Navbar title="User Account Profile" subtitle="Account credentials, system role access, and security settings" />

      <main className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="bi-card p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>

          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-6 border-b border-slate-800">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary to-cyan-light flex items-center justify-center text-white text-3xl font-extrabold shadow-glow">
              {user?.name?.charAt(0) || 'U'}
            </div>

            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-extrabold text-white">{user?.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  user?.role === 'Admin' ? 'bg-primary/20 text-primary-light border border-primary/40' : 'bg-cyan/20 text-cyan-light border border-cyan/40'
                }`}>
                  {user?.role}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 font-mono">{user?.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-1 text-xs text-emerald-400 font-medium mt-2">
                <CheckCircle2 size={13} /> Active Authenticated Token Session
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Account Credentials</h3>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-2">
                    <User size={14} /> Full Name:
                  </span>
                  <span className="font-semibold text-white">{user?.name}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Mail size={14} /> Email Address:
                  </span>
                  <span className="font-mono text-white">{user?.email}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-2">
                    <ShieldCheck size={14} /> Role Permission:
                  </span>
                  <span className="font-semibold text-primary-light">{user?.role}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Security & Access Control</h3>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3 text-xs">
                <p className="text-slate-300">
                  Your account is granted <span className="font-bold text-white">{user?.role}</span> access level to the SalesIQ Business Intelligence platform.
                </p>
                {user?.role === 'Admin' ? (
                  <p className="text-emerald-400 font-medium">
                    ✓ Full administrative permissions enabled (User Management & System Telemetry).
                  </p>
                ) : (
                  <p className="text-cyan-light font-medium">
                    ✓ Manager permissions enabled (Analytics, ML Forecasting, Segmentation & Inventory).
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
