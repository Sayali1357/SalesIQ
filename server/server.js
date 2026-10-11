const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Connect MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

const mongoose = require('mongoose');

// Root API Welcome / Status
app.get('/', (req, res) => {
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown';
  res.json({
    status: 'online',
    message: 'SalesIQ Backend REST API is active and running',
    database: {
      status: dbState,
      name: mongoose.connection.name || 'salesiq'
    },
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      dashboard: '/api/dashboard',
      forecast: '/api/forecast',
      customers: '/api/customers',
      recommendations: '/api/recommendations',
      inventory: '/api/inventory',
      alerts: '/api/alerts',
      data: '/api/data'
    },
    timestamp: new Date().toISOString()
  });
});

// Health Check API
app.get('/api/health', (req, res) => {
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown';
  res.json({
    status: 'online',
    service: 'SalesIQ REST API Gateway',
    database: {
      status: dbState,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    },
    timestamp: new Date().toISOString()
  });
});

// Mounting API Routes (Dedicated to Authentication & Registration)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api', require('./routes/userRoutes'));


// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ message: `API Endpoint ${req.originalUrl} Not Found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SalesIQ Express Server running on port ${PORT}`);
});
