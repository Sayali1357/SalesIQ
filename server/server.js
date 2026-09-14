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

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'SalesIQ REST API Gateway',
    timestamp: new Date().toISOString()
  });
});

// Mounting API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/forecast', require('./routes/forecastRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/recommendations', require('./routes/recommendationRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/alerts', require('./routes/alertRoutes'));
app.use('/api/data', require('./routes/dataUploadRoutes'));
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
