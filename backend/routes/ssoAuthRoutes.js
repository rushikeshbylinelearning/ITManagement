// it-managaement-app/backend/routes/ssoAuthRoutes.js

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifySSOToken } = require('../utils/ssoService');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @desc    Handles the redirect from the SSO Portal. This is the new primary login endpoint.
 * @route   GET /api/auth/sso/callback
 * @access  Public
 */
router.get('/sso/callback', async (req, res) => {
  const { sso_token, return_url } = req.query;
  console.log('🔐 [IT_APP] SSO Callback Hit on Backend');

  if (!sso_token) {
    console.error('❌ [IT_APP] No SSO token provided in callback');
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=MissingSSOToken`);
  }

  try {
    const decodedToken = await verifySSOToken(sso_token);
    const ssoUser = decodedToken.user;
    console.log(`✅ [IT_APP] SSO Token validated for user: ${ssoUser.email}`);

    let user = await User.findOne({ email: ssoUser.email });
    if (!user) {
      user = await User.create({
        
        name: ssoUser.name,
        email: ssoUser.email,
        role: ssoUser.role,
        employeeId: ssoUser.employeeId,
        password: `sso-user-${Date.now()}`,
      });
      console.log(`✅ [IT_APP] Provisioned new user via SSO: ${user.email}`);
    } else {
      user.name = ssoUser.name;
      user.role = ssoUser.role;
      user.employeeId = ssoUser.employeeId;
      await user.save();
      console.log(`✅ [IT_APP] Refreshed user details via SSO: ${user.email}`);
    }

    const localSessionToken = jwt.sign(
        { id: user._id, role: user.role }, 
        process.env.LOCAL_JWT_SECRET, 
        { expiresIn: '8h' }
    );
    console.log(`🍪 [IT_APP] Generated local session token for user: ${user.email}`);

    res.cookie('it_app_token', localSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
    });
    console.log('🍪 [IT_APP] Set local session cookie.');

    const finalRedirectUrl = return_url || `${process.env.FRONTEND_URL}/dashboard`;
    console.log(`🔄 [IT_APP] Redirecting user to frontend: ${finalRedirectUrl}`);
    res.redirect(finalRedirectUrl);

  } catch (error) {
    console.error('❌ [IT_APP] SSO Callback failed:', error.message);
    const errorMessage = encodeURIComponent(error.message);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=${errorMessage}`);
  }
});

/**
 * @desc    Get the currently logged-in user based on the local session cookie.
 * @route   GET /api/auth/me
 * @access  Private
 */
router.get('/me', protect, (req, res) => {
    // This route now correctly exists at /api/auth/me
    console.log(`✅ [IT_APP] /me endpoint hit. User ${req.user.email} is authenticated.`);
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
    console.log('🔴 [IT_APP] Logging out. Clearing local session cookie.');
    res.cookie('it_app_token', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    
    // Provide the SSO logout URL to the frontend to handle the redirect
    const ssoLogoutUrl = `${process.env.SSO_PORTAL_URL}/api/auth/logout`;
    res.status(200).json({ success: true, ssoLogoutUrl });
});

module.exports = router;
