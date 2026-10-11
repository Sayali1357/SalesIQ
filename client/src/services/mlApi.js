import axios from 'axios';

// Direct connection to Python ML Service (FastAPI)
const ML_BASE_URL = import.meta.env.VITE_ML_API_URL 
  ? import.meta.env.VITE_ML_API_URL.replace(/\/$/, '') 
  : 'http://localhost:8000';

const ML_API = axios.create({
  baseURL: ML_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000 // ML inference and training can take some seconds
});

// Response Interceptor for friendly logging
ML_API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn('[ML Service Error]:', error.response?.data?.detail || error.message);
    return Promise.reject(error);
  }
);

export default ML_API;
