// backend/utils/ssoService.js

const axios = require('axios');
const jwt = require('jsonwebtoken');

// In-memory cache for the SSO public key to improve performance
let ssoPublicKey = null;
let keyCacheTimestamp = 0;
const KEY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches the public key from the SSO Portal, with caching.
 */
const getSSOPublicKey = async () => {
  const now = Date.now();
  if (ssoPublicKey && now < keyCacheTimestamp + KEY_CACHE_DURATION) {
    return ssoPublicKey;
  }

  try {
    console.log(`🔑 Fetching SSO public key from: ${process.env.SSO_PORTAL_URL}/api/auth/public-key`);
    const response = await axios.get(`${process.env.SSO_PORTAL_URL}/api/auth/public-key`);
    
    if (!response.data) {
        throw new Error("Public key endpoint did not return a key.");
    }
    
    ssoPublicKey = response.data;
    keyCacheTimestamp = now;

    console.log('✅ Successfully fetched and cached SSO public key.');
    return ssoPublicKey;
  } catch (error) {
    console.error('❌ CRITICAL: Could not fetch SSO public key.', error.message);
    ssoPublicKey = null; // Invalidate cache on error
    throw new Error('Could not verify token: SSO Portal public key is unavailable.');
  }
};

/**
 * Verifies an SSO token using the public key from the SSO Portal.
 * @param {string} token The JWT token from the sso_token query parameter.
 * @returns {Promise<object>} The decoded payload of the token if valid.
 */
const verifySSOToken = async (token) => {
  const publicKey = await getSSOPublicKey();
  const audience = process.env.SSO_APP_AUDIENCE;

  if (!audience || audience === 'YOUR_APP_ID_FROM_SSO_DATABASE') {
      throw new Error("SSO_APP_AUDIENCE is not configured correctly in the .env file.");
  }

  try {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],         // Must be RS256
      issuer: 'sso-portal',          // Must match issuer in SSO Portal
      audience: audience,            // Must match the ID of this specific app
    });
    console.log('✅ SSO token verified successfully for audience:', decoded.aud);
    return decoded;
  } catch (error) {
    console.error('❌ SSO Token verification failed:', error.message);
    throw new Error(`Invalid SSO token: ${error.message}`);
  }
};

module.exports = { verifySSOToken };
