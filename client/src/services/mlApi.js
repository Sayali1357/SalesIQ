import axios from 'axios';

// Resolve Python ML Service Base URL
const rawMlUrl = import.meta.env.VITE_ML_API_URL;
const isProd = import.meta.env.PROD;

export const isMlConfigured = Boolean(rawMlUrl);

export const ML_BASE_URL = rawMlUrl
  ? rawMlUrl.replace(/\/$/, '')
  : (isProd ? '' : 'http://localhost:8000');

if (isProd && !rawMlUrl) {
  console.warn(
    '[SalesIQ Warning]: VITE_ML_API_URL environment variable is not defined in this production build.\n' +
    'Charts will utilize resilient cached analytics data if the ML service endpoint is unreachable.'
  );
}

const ML_API = axios.create({
  baseURL: ML_BASE_URL || '/api/ml',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // Fast failover with instant cached fallback
});

// Response Interceptor for graceful error handling
ML_API.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMsg = error.response?.data?.detail || error.message;
    console.warn('[SalesIQ ML Service Alert]:', errorMsg);
    return Promise.reject(error);
  }
);

export default ML_API;
