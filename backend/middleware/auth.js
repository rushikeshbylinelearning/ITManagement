// middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes by verifying the LOCAL session token from the cookie
const protect = async (req, res, next) => {
    let token;

    if (req.cookies && req.cookies.it_app_token) {
        token = req.cookies.it_app_token;
    }

    if (!token) {
        return res.status(401).json({ msg: 'Not authorized, no token provided' });
    }

    try {
        // Verify the local session token with the local secret
        const secret = process.env.LOCAL_JWT_SECRET || process.env.JWT_SECRET;
        
        if (!secret) {
            console.error('❌ JWT_SECRET not configured');
            return res.status(500).json({ msg: 'Server configuration error: JWT secret not set' });
        }
        
        const decoded = jwt.verify(token, secret);

        // Attach user to the request object
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
            return res.status(401).json({ msg: 'Not authorized, user not found' });
        }

        // ✅ STRICT LOGIN VALIDATION - Verify loginType matches user role
        if (decoded.loginType) {
            const adminRoles = ['admin'];
            const employeeRoles = ['user', 'employee', 'intern'];

            if (decoded.loginType === 'admin' && !adminRoles.includes(req.user.role)) {
                // Clear the invalid cookie
                res.cookie('it_app_token', '', { httpOnly: true, expires: new Date(0) });
                return res.status(403).json({ 
                    msg: 'Session invalid: Role mismatch detected. Please log in again.',
                    sessionInvalid: true
                });
            }

            if (decoded.loginType === 'employee' && !employeeRoles.includes(req.user.role)) {
                // Clear the invalid cookie
                res.cookie('it_app_token', '', { httpOnly: true, expires: new Date(0) });
                return res.status(403).json({ 
                    msg: 'Session invalid: Role mismatch detected. Please log in again.',
                    sessionInvalid: true
                });
            }
        }

        next();
    } catch (err) {
        console.error('Local token verification failed:', err.message);
        // Clear the invalid cookie
        res.cookie('it_app_token', '', { httpOnly: true, expires: new Date(0) });
        return res.status(401).json({ msg: 'Not authorized, token failed' });
    }
};

// Middleware to authorize based on user roles
const authorize = (...roles) => {
    return (req, res, next) => {
        console.log('🔒 Authorization Check:', {
            requiredRoles: roles,
            userRole: req.user?.role,
            userEmail: req.user?.email,
            userId: req.user?._id
        });
        
        if (!req.user) {
            console.error('❌ Authorization failed: No user in request');
            return res.status(403).json({ 
                msg: 'Forbidden: User not authenticated.'
            });
        }
        
        if (!roles.includes(req.user.role)) {
            console.error('❌ Authorization failed:', {
                userRole: req.user.role,
                requiredRoles: roles
            });
            return res.status(403).json({ 
                msg: `Forbidden: User role '${req.user.role}' is not authorized. Required: ${roles.join(' or ')}`
            });
        }
        
        console.log('✅ Authorization successful for', req.user.email);
        next();
    };
};

module.exports = { protect, authorize };