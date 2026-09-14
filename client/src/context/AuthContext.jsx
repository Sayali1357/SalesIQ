import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('salesiq_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('salesiq_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await API.post('/auth/login', { email, password });
      setUser(data);
      localStorage.setItem('salesiq_user', JSON.stringify(data));
      return { success: true, user: data };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please check credentials.';
      return { success: false, error: msg };
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const { data } = await API.post('/auth/register', { name, email, password, role });
      setUser(data);
      localStorage.setItem('salesiq_user', JSON.stringify(data));
      return { success: true, user: data };
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed.';
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('salesiq_user');
    window.location.href = '/login';
  };

  const isAdmin = user && user.role === 'Admin';
  const isManager = user && (user.role === 'Manager' || user.role === 'Admin');

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, isManager }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
