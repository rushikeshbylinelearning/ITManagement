// server.js

// Ensure dotenv is loaded first to make environment variables available
require('dotenv').config(); 

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Security and Performance Packages
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const morgan = require('morgan');

// Initialize Express App and HTTP Server
const app = express();
const server = http.createServer(app);

// --- CORS Configuration ---
// This allows your frontend (running on different ports/domains) to communicate with this backend.
const corsOptions = {
  origin: [
    'http://localhost:5175', // Vite dev server for this app
    'http://localhost:5174', // Vite dev server for this app
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000',
    'https://itmanagement.bylinelms.com' // Production frontend
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true // This is CRITICAL for cookies to be sent and received
};
app.use(cors(corsOptions));

// --- Socket.io Setup ---
const io = new Server(server, {
    cors: corsOptions
});

// =================================================================
// --- CORE MIDDLEWARE & API HARDENING ---
// =================================================================

// Set security-related HTTP headers
// Configure helmet with appropriate CSP for downloads and API calls
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        'http://localhost:5001',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'https://itmanagement.bylinelms.com',
        'ws://localhost:5001',
        'wss://itmanagement.bylinelms.com'
      ],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Body parser, reading data from body into req.body
// Increased limit to handle large payloads (agent registration, file uploads, etc.)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Cookie parser - MUST come before any routes that use cookies
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Compress all responses for better performance
app.use(compression());

// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Rate Limiting to prevent brute-force attacks
// More lenient limits for development and monitoring
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased limit for monitoring dashboard polling
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false
});

// Apply rate limiting to all API routes except monitoring
app.use('/api', (req, res, next) => {
    // Skip rate limiting for monitoring endpoints that need frequent polling
    if (req.path.includes('/monitoring/') || req.path.includes('/auth/me')) {
        return next();
    }
    return limiter(req, res, next);
});

// Apply stricter rate limiting to auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Stricter limit for auth endpoints
    message: 'Too many authentication requests, please try again after 15 minutes'
});
app.use('/api/auth', authLimiter);

// Custom middleware to make socket.io available to all routes
app.use((req, res, next) => {
    req.io = io;
    res.set('Cache-Control', 'no-store'); // Prevents browser caching issues with API responses
    next();
});

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully for IT Management App.'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// =================================================================
// --- ROUTING ---
// =================================================================

// --- Import Route Files ---
const authRoutes = require('./routes/auth'); // Authentication routes
const assetRoutes = require('./routes/assets');
const ticketRoutes = require('./routes/tickets');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const inventoryRoutes = require('./routes/inventory');
const allocationRoutes = require('./routes/allocations');
const componentTypeRoutes = require('./routes/componentTypes');
const inquiryRoutes = require('./routes/inquiries');
const hrInventoryRoutes = require('./routes/hrInventory');
const roboticsInventoryRoutes = require('./routes/roboticsInventory');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const networkMonitoringRoutes = require('./routes/networkMonitoring');

// --- Import Middleware ---
const { protect, authorize } = require('./middleware/auth');

// --- Public Routes ---
// These routes do not require a user to be logged in.
app.use('/api/auth', authRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/downloads', express.static('downloads')); // Network monitoring agent downloads

// --- Protected Routes ---
// The `protect` middleware will be applied to every route defined below this line.
// It checks for the valid session cookie (`it_app_token`).
app.use('/api/assets', protect, assetRoutes);
app.use('/api/tickets', protect, ticketRoutes);
app.use('/api/users', protect, userRoutes);
app.use('/api/dashboard', protect, dashboardRoutes);
app.use('/api/inventory', protect, inventoryRoutes);
app.use('/api/allocations', protect, allocationRoutes);
app.use('/api/component-types', protect, componentTypeRoutes);
app.use('/api/inquiries', protect, inquiryRoutes);
app.use('/api/hr-inventory', protect, hrInventoryRoutes);
app.use('/api/robotics-inventory', protect, roboticsInventoryRoutes);
app.use('/api/admin', protect, authorize('admin'), adminRoutes); // This one is protected AND admin-only
app.use('/api/upload', protect, uploadRoutes);
app.use('/api/network-monitoring', networkMonitoringRoutes); // Mixed auth: some routes use protect, some use agent verification

// --- Start Server ---
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 IT Management Server running on port ${PORT}`));