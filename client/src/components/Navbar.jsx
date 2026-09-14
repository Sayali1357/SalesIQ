import React, { useState, useEffect } from 'react';
import { Search, Bell, Sparkles, Server, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

const Navbar = ({ title, subtitle }) => {
  const { user } = useAuth();
  const [unreadAlerts, setUnreadAlerts] = useState(3);
  const [mlStatus, setMlStatus] = useState('Active');

  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const { data } = await API.get('/alerts?resolved=false');
        if (data && data.alerts) {
          setUnreadAlerts(data.alerts.length);
        }
      } catch (e) {
        // quiet
      }
    };
    fetchAlertCount();
  }, []);

  return (
    <header className="h-16 bg-sidebar/80 backdrop-blur border-b border-border/60 px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h2>
        {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* ML Status Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <Server size={13} />
          <span>Python ML Engine Connected</span>
        </div>

        {/* System Time */}
        <div className="hidden lg:block text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>

        {/* Alert Bell Button */}
        <a 
          href="/alerts" 
          className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="KPI Alerts"
        >
          <Bell size={20} />
          {unreadAlerts > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
              {unreadAlerts}
            </span>
          )}
        </a>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary-light flex items-center justify-center font-bold text-sm border border-primary/40">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-white leading-tight">{user?.name}</p>
            <p className="text-[10px] text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
