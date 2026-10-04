import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` : '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor attaching JWT Token
API.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('salesiq_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch (e) {
      console.error('Error parsing token from localStorage', e);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor handling 401 Unauthorized
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('salesiq_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
