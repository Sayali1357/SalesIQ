import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Forecasting from './pages/Forecasting';
import CustomerSegmentation from './pages/CustomerSegmentation';
import Recommendations from './pages/Recommendations';
import Inventory from './pages/Inventory';
import Alerts from './pages/Alerts';
import AdminPanel from './pages/AdminPanel';
import DataManagement from './pages/DataManagement';
import UserProfile from './pages/UserProfile';
import NotFound from './pages/NotFound';

const DashboardLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <Outlet />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes for Manager and Admin */}
          <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/forecasting" element={<Forecasting />} />
              <Route path="/customers" element={<CustomerSegmentation />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/profile" element={<UserProfile />} />

              {/* Admin-Only Route */}
              <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/data-management" element={<DataManagement />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
