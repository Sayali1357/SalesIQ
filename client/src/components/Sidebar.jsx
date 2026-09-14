import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Bot, 
  Package, 
  BellRing, 
  ShieldCheck, 
  User, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  DatabaseZap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: BarChart3 },
    { name: 'Sales Forecasting', path: '/forecasting', icon: TrendingUp },
    { name: 'Customer Segments', path: '/customers', icon: Users },
    { name: 'Recommendations', path: '/recommendations', icon: Bot },
    { name: 'Inventory & Demand', path: '/inventory', icon: Package },
    { name: 'KPI Alerts', path: '/alerts', icon: BellRing },
    ...(isAdmin ? [
      { name: 'Data Management', path: '/data-management', icon: DatabaseZap },
      { name: 'Admin Panel', path: '/admin', icon: ShieldCheck }
    ] : [])
  ];

  return (
    <aside 
      className={`bg-sidebar border-r border-border/80 flex flex-col justify-between transition-all duration-300 relative z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Toggle Collapse Button */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 bg-slate-800 border border-slate-700 text-slate-300 rounded-full p-1 hover:text-white hover:bg-slate-700 transition-colors shadow-md z-40"
        title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div>
        {/* Logo Header */}
        <div className={`p-5 flex items-center gap-3 border-b border-border/60 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-cyan-light flex items-center justify-center shadow-glow shrink-0">
            <BarChart3 className="text-white w-6 h-6" />
          </div>
          {!collapsed && (
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-xl tracking-tight text-white">SalesIQ</h1>
                <span className="text-[10px] uppercase font-bold bg-primary/20 text-primary-light px-1.5 py-0.5 rounded border border-primary/30">AI</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Real-Time Analytics Platform</p>
            </div>
          )}
        </div>

        {/* User Role Pill */}
        <div className={`mx-3 my-4 p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary-light flex items-center justify-center font-bold text-sm shrink-0 border border-primary/40">
            {user?.name?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-primary' : 'bg-cyan'}`}></span>
                <span className="text-[11px] text-slate-400 capitalize font-medium">{user?.role || 'Manager'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Main Nav Items */}
        <nav className="px-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-primary/20 text-white border border-primary/40 shadow-glow font-semibold' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  } ${collapsed ? 'justify-center px-0' : ''}`
                }
                title={collapsed ? item.name : ''}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer User Profile & Logout */}
      <div className="p-3 border-t border-border/60 space-y-1">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            } ${collapsed ? 'justify-center px-0' : ''}`
          }
          title={collapsed ? "User Profile" : ''}
        >
          <User size={18} className="shrink-0" />
          {!collapsed && <span>User Profile</span>}
        </NavLink>

        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 transition-all ${
            collapsed ? 'justify-center px-0' : ''
          }`}
          title={collapsed ? "Sign Out" : ''}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
