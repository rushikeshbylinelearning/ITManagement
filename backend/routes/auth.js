// routes/auth.js

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const AgentToken = require('../models/AgentToken');
const { verifySSOToken } = require('../utils/ssoService'); // Our new SSO utility
const { protect } = require('../middleware/auth'); // Our new protect middleware

const router = express.Router();

// --- SSO AUTHENTICATION FLOW ---

/**
 * @desc    Handles the redirect from the SSO Portal. This is the new primary login endpoint.
 * @route   GET /api/auth/sso/callback
 * @access  Public
 */
router.get('/sso/callback', async (req, res) => {
  const { sso_token, return_url } = req.query;

  if (!sso_token) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=MissingSSOToken`);
  }

  try {
    // 1. Verify the incoming sso_token against the SSO Portal's public key.
    const decodedToken = await verifySSOToken(sso_token);
    const ssoUser = decodedToken.user;

    // 2. Find or create the user in the IT Management app's database.
    let user = await User.findOne({ email: ssoUser.email });

    if (!user) {
      user = await User.create({
        name: ssoUser.name,
        email: ssoUser.email,
        role: ssoUser.role,
        employeeId: ssoUser.employeeId,
        password: `sso-user-${Date.now()}`, // Random, unusable password
      });
      console.log(`✅ Provisioned new user via SSO: ${user.email}`);
    } else {
      user.name = ssoUser.name;
      user.role = ssoUser.role;
      user.employeeId = ssoUser.employeeId;
      await user.save();
      console.log(`✅ Refreshed user details via SSO: ${user.email}`);
    }

    // 3. Create a LOCAL session token for THIS application.
    const localSessionToken = jwt.sign(
        { id: user._id, role: user.role }, 
        process.env.LOCAL_JWT_SECRET, 
        { expiresIn: '8h' }
    );

    // 4. Set the new session cookie, overwriting any old ones.
    res.cookie('it_app_token', localSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Use 'lax' for better redirect compatibility
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });

    // 5. Redirect the user to the frontend dashboard.
    res.redirect(return_url || `${process.env.FRONTEND_URL}/dashboard`);

  } catch (error) {
    console.error('SSO Callback failed:', error.message);
    const errorMessage = encodeURIComponent(error.message);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=${errorMessage}`);
  }
});


// --- DIRECT AUTHENTICATION (Fallback) ---

/**
 * @desc    Directly authenticate a user and get a local session token.
 * @route   POST /api/auth/login
 * @access  Public
 */
router.post('/login', async (req, res) => {
    const { email, password, loginType } = req.body;
    
    // Validation
    if (!email || !password) {
        return res.status(400).json({ msg: 'Please provide email and password' });
    }
    
    try {
        const user = await User.findOne({ email });
        
        // Check if user exists
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Check if the user's role matches the login type (optional check - can be removed if causing issues)
        // Note: Frontend already handles role-based routing, so this is just an extra layer
        // Commented out to allow flexible login:
        // if (loginType === 'admin' && !['admin', 'technician'].includes(user.role)) {
        //     return res.status(403).json({ msg: 'Access denied. Admin or Technician role required.' });
        // }
        // 
        // if (loginType === 'employee' && user.role === 'admin') {
        //     return res.status(403).json({ msg: 'Please use the Admin/Technician portal to log in.' });
        // }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Create the same local token as the SSO flow
        const localSessionToken = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.LOCAL_JWT_SECRET, 
            { expiresIn: '8h' }
        );

        res.cookie('it_app_token', localSessionToken, {
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


// --- SESSION MANAGEMENT ---

/**
 * @desc    Get the currently logged-in user based on the local session cookie.
 * @route   GET /api/auth/me
 * @access  Private
 */
router.get('/me', protect, (req, res) => {
    // The 'protect' middleware already found the user and attached it to req.user
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
 * @desc    Log user out by clearing the local cookie and redirecting to SSO logout.
 * @route   GET /api/auth/logout
 * @access  Public
 */
router.get('/logout', (req, res) => {
    // Clear the local application cookie
    res.cookie('it_app_token', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    
    // Redirect to the SSO Portal's logout endpoint to terminate the global session
    res.redirect(`${process.env.SSO_PORTAL_URL}/api/auth/logout`);
});

// --- AGENT TOKEN GENERATION ---

/**
 * @desc    Generate a one-time registration token for monitoring agent
 * @route   POST /api/auth/agent-token
 * @access  Private
 */
router.post('/agent-token', protect, async (req, res) => {
    try {
        const { hostname, os } = req.body;
        
        // Generate unique token
        const token = crypto.randomBytes(32).toString('hex');
        
        // Token expires in 5 minutes
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        
        // Create token record
        const agentToken = await AgentToken.create({
            token,
            userId: req.user._id,
            username: req.user.name,
            hostname: hostname || null,
            os: os || null,
            ipAddress: req.ip || req.headers['x-forwarded-for'],
            expiresAt
        });
        
        console.log(`✅ Generated agent token for user ${req.user.email}: ${token}`);
        
        res.json({
            success: true,
            token,
            expiresAt,
            expiresIn: 300 // 5 minutes in seconds
        });
        
    } catch (error) {
        console.error('Error generating agent token:', error);
        res.status(500).json({
            success: false,
            msg: 'Error generating agent token',
            error: error.message
        });
    }
});

module.exports = router;