/**
 * SharePlate AI: Main Express Server
 * Modules 1, 2, 3, 4 Integration
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { getDb } = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const donationRoutes = require('./src/routes/donationRoutes');
const recipientRoutes = require('./src/routes/recipientRoutes');
const matchingRoutes = require('./src/routes/matchingRoutes');
const pickupRoutes = require('./src/routes/pickupRoutes');
const impactRoutes = require('./src/routes/impactRoutes');
const healthRoutes = require('./src/routes/healthRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(cors({
  origin: '*', // Allow all during development and demonstration
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'x-user-id', 'x-org-id']
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Request Logger for Security & Auditing
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Initialize Database connection eagerly
try {
  getDb();
  console.log('[SharePlate AI Backend] Relational Database connected and verified.');
} catch (dbErr) {
  console.error('[SharePlate AI Backend] Database initialization error:', dbErr.message);
}

// Mount REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/recipients', recipientRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/impact', impactRoutes);
app.use('/api/health', healthRoutes);

// Root Index Route
app.get('/', (req, res) => {
  res.json({
    service: 'SharePlate AI: Smart Food Waste Redistribution Platform API',
    status: 'ONLINE',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: [
      '/api/donations',
      '/api/recipients',
      '/api/matching',
      '/api/pickups',
      '/api/impact/dashboard',
      '/api/auth/login',
      '/api/health'
    ]
  });
});

// Global 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Requested route ${req.method} ${req.originalUrl} does not exist.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected operational error occurred.',
    timestamp: new Date().toISOString()
  });
});

// Start Server if not imported by test runner
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(` SharePlate AI Server running at: http://localhost:${PORT}`);
    console.log(` Health Check & DB Connectivity:  http://localhost:${PORT}/api/health`);
    console.log(` Impact Dashboard API:           http://localhost:${PORT}/api/impact/dashboard`);
    console.log(`================================================================`);
  });
}

module.exports = app;
