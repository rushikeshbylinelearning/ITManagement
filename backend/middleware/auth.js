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
        const decoded = jwt.verify(token, process.env.LOCAL_JWT_SECRET);

        // Attach user to the request object
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
            return res.status(401).json({ msg: 'Not authorized, user not found' });
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
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                msg: `Forbidden: User role '${req.user.role}' is not authorized.`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };