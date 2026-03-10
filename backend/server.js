// ==========================================
// server.js - Main Entry Point
// Starts the Express server, connects to MongoDB,
// and registers all routes.
// ==========================================

require('dotenv').config();
require('express-async-errors'); // Automatically catches async errors without try/catch
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const scheduleJobs = require('./utils/scheduler');

// Import all route files
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const volunteerRoutes = require('./routes/volunteers');
const cityRoutes = require('./routes/cities');
const inventoryRoutes = require('./routes/inventory');
const bookstallRoutes = require('./routes/bookstalls');
const saleRoutes = require('./routes/sales');
const expenditureRoutes = require('./routes/expenditures');
const scheduleRoutes = require('./routes/schedules');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');

const app = express();

// ---- Middleware ----
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // Allow larger payloads for base64 images
app.use(express.urlencoded({ extended: true }));

// ---- Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/bookstalls', bookstallRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/expenditures', expenditureRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint for Render
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// ---- Global Error Handler (must be last middleware) ----
app.use(errorHandler);

// ---- Start Server ----
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB(); // Connect to MongoDB first
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    scheduleJobs(); // Start cron jobs (e.g., notifications before bookstall)
  });
};

startServer();
