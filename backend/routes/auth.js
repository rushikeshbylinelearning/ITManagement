// routes/auth.js

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @desc    Authenticate a user and get a session token
 * @route   POST /api/auth/login
 * @access  Public
 */
router.post('/login', async (req, res) => {
    const { email, password, loginType } = req.body;
    
    // Validation
    if (!email || !password) {
        return res.status(400).json({ msg: 'Please provide email and password' });
    }

    // Validate loginType
    if (!loginType || !['employee', 'admin'].includes(loginType)) {
        return res.status(400).json({ msg: 'Invalid login type' });
    }
    
    try {
        const user = await User.findOne({ email });
        
        // Check if user exists
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // ✅ STRICT LOGIN VALIDATION - Prevent cross-portal login
        // Define which roles can use which login portal
        const adminRoles = ['admin'];
        const employeeRoles = ['user', 'employee', 'intern'];

        if (loginType === 'admin') {
            // Admin portal: Only admins can log in
            if (!adminRoles.includes(user.role)) {
                return res.status(403).json({ 
                    msg: 'Access denied. This portal is for administrators only. Please use the employee login portal.',
                    portalMismatch: true,
                    correctPortal: 'employee'
                });
            }
        } else if (loginType === 'employee') {
            // Employee portal: Only non-admin users can log in
            if (!employeeRoles.includes(user.role)) {
                return res.status(403).json({ 
                    msg: 'Access denied. This portal is for employees only. Please use the admin login portal.',
                    portalMismatch: true,
                    correctPortal: 'admin'
                });
            }
        }

        // Create session token
        const secret = process.env.LOCAL_JWT_SECRET || process.env.JWT_SECRET;
        
        if (!secret) {
            console.error('❌ JWT_SECRET not configured for login');
            return res.status(500).json({ msg: 'Server configuration error: JWT secret not set' });
        }
        
        const sessionToken = jwt.sign(
            { id: user._id, role: user.role, loginType }, 
            secret, 
            { expiresIn: '8h' }
        );

        res.cookie('it_app_token', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 8 * 60 * 60 * 1000,
        });

        res.status(200).json({
           success: true,
           user: {
               id: user.id, name: user.name, email: user.email, role: user.role
           }
        });

    } catch (err) {
        console.error('🚨 LOGIN ERROR:', err);
        res.status(500).send('Server error');
    }
});

/**
 * @desc    Get the currently logged-in user based on the session cookie
 * @route   GET /api/auth/me
 * @access  Private
 */
router.get('/me', protect, (req, res) => {
    res.status(200).json({
        success: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
        }
    });
});

/**
 * @desc    Log user out by clearing the session cookie
 * @route   GET /api/auth/logout
 * @access  Public
 */
router.get('/logout', (req, res) => {
    res.cookie('it_app_token', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    
    res.status(200).json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;