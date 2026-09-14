import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({ title, value, change, isPositive = true, icon: Icon, color = 'primary', subtitle = 'vs prev period' }) => {
  return (
    <div className="bi-card relative overflow-hidden group">
      {/* Background Accent Glow */}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          {Icon && <Icon size={16} className="text-slate-300" />}
          {title}
        </span>

        {change !== undefined && (
          <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${
            isPositive 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            <span>{isPositive ? `+${change}%` : `${change}%`}</span>
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-extrabold text-white tracking-tight">{value}</h3>
      </div>

      {subtitle && (
        <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StatCard;
