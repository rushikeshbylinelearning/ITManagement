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
    'http://localhost:5173', // Vite dev server for SSO Portal (optional but good for some flows)
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
app.use(helmet());

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

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
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per window
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);

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
const authRoutes = require('./routes/auth'); // Authentication routes (includes both SSO and traditional login)
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
const monitoringRoutes = require('./routes/monitoring');
const activityMonitorRoutes = require('./routes/activityMonitor');

// --- Import Middleware ---
const { protect, authorize } = require('./middleware/auth'); // ✅ CORRECTED: Use the new SSO-compatible middleware

// --- Public Routes ---
// These routes do not require a user to be logged in.
// The SSO callback is the most important public route.
app.use('/api/auth', authRoutes);
app.use('/uploads', express.static('uploads'));

// --- Protected Routes ---
// The `protect` middleware will be applied to every route defined below this line.
// It checks for the valid local session cookie (`it_app_token`).
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
app.use('/api/monitoring', monitoringRoutes); // Monitoring routes (mixed auth: API key for agents, JWT for admin)
app.use('/api/activity-monitor', activityMonitorRoutes); // Activity monitoring routes (mixed auth: agent token + JWT)

// =================================================================

// --- Socket.io Connection Logic ---
io.on('connection', (socket) => {
    console.log('A user connected to IT App via Socket.io:', socket.id);
    socket.on('disconnect', () => {
        console.log('User disconnected from IT App:', socket.id);
    });
});

// --- Scheduled Tasks for Monitoring ---
const { checkAllHostsStatus } = require('./utils/alertRules');

// Check host status every 5 minutes
setInterval(async () => {
    try {
        console.log('Running scheduled host status check...');
        const alerts = await checkAllHostsStatus();
        if (alerts.length > 0) {
            console.log(`Generated ${alerts.length} offline host alerts`);
            io.emit('monitoring:alerts', alerts);
        }
    } catch (error) {
        console.error('Error in scheduled host status check:', error);
    }
}, 5 * 60 * 1000); // Every 5 minutes

// --- Start Activity Analyzer Worker ---
const activityAnalyzer = require('./worker/activityAnalyzer');
activityAnalyzer.start();

// --- Start Server ---
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 IT Management Server running on port ${PORT}`));