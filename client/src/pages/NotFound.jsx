import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400 mb-4 shadow-glow">
        <AlertTriangle size={32} />
      </div>
      <h1 className="text-4xl font-extrabold text-white">404 - Page Not Found</h1>
      <p className="text-slate-400 text-sm max-w-md mt-2 mb-6">
        The route or analytics dashboard view you are trying to access does not exist or has been moved.
      </p>
      <Link to="/dashboard" className="bi-btn-primary">
        <Home size={16} /> Return to SalesIQ Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
