# SSO Token Validation Setup Guide

## 🎯 **Problem Solved**

This implementation fixes the "Invalid SSO token" error by implementing proper RS256 token validation for your IT Management Application.

## 📁 **Files Created/Modified**

### 1. **Backend Environment Configuration** (`backend/.env`)
```env
# IT Management App - .env

# The port this backend will run on
PORT=5001

# Your MongoDB connection string
MONGO_URI=mongodb+srv://bylinelearning:admin%40Byline25@bylinelearning.oqxlbny.mongodb.net/it-management-app?retryWrites=true&w=majority&tls=true

# JWT Secret for local session tokens
JWT_SECRET=BYLINE-RRJ-004-06
JWT_EXPIRE=8h

# Frontend URL
FRONTEND_URL=http://localhost:5174

# --- SSO CONFIGURATION ---
# URL of the SSO Portal that provides the tokens
SSO_PORTAL_URL=http://localhost:3001

# The UNIQUE App ID (or Client ID) for THIS application.
# You must get this value from the 'apps' collection in your SSO Portal's database.
# It is the MongoDB _id for the "IT_Management" application.
IT_APP_ID=YOUR_APP_ID_FROM_SSO_DATABASE

# SSO Token Configuration
SSO_ISSUER=sso-portal
SSO_AUDIENCE=it-management-app

# CORS Configuration
CORS_ORIGIN=http://localhost:5174,http://localhost:3000,https://itmanagement.bylinelms.com
```

### 2. **SSO Service** (`backend/utils/ssoService.js`)
- Fetches public key from SSO Portal (`/api/auth/public-key`)
- Validates RS256-signed tokens with proper algorithm and audience
- Caches public key for performance
- Provides detailed error logging

### 3. **SSO Authentication Routes** (`backend/routes/ssoAuthRoutes.js`)
- `GET /api/auth/sso/callback` - Main SSO callback endpoint
- `POST /api/auth/sso/validate` - API-based SSO validation
- `GET /api/auth/sso/logout` - SSO logout with global session clearing

### 4. **Updated Server Configuration** (`backend/server.js`)
- Added new SSO routes to the application

## 🔧 **Critical Configuration Steps**

### **Step 1: Get Your App ID from SSO Portal Database**

You **MUST** update the `IT_APP_ID` in your `.env` file:

1. **Connect to your SSO Portal's MongoDB database**
2. **Find the `apps` collection**
3. **Look for the "IT_Management" application document**
4. **Copy the `_id` field value**
5. **Update `IT_APP_ID` in `backend/.env`**

Example:
```env
IT_APP_ID=507f1f77bcf86cd799439011
```

### **Step 2: Verify SSO Portal Configuration**

Ensure your SSO Portal:
- ✅ Runs on `http://localhost:3001`
- ✅ Exposes public key at `/api/auth/public-key`
- ✅ Signs tokens with RS256 algorithm
- ✅ Uses `sso-portal` as issuer
- ✅ Uses your App ID as audience

### **Step 3: Test the Integration**

1. **Start your SSO Portal** on port 3001
2. **Start your IT Management App** on port 5001
3. **Test the SSO flow**:
   - Login to SSO Portal
   - Click IT Management App link
   - Verify automatic login

## 🚀 **How It Works**

### **SSO Authentication Flow:**

1. **User clicks IT Management App link** in SSO Portal
2. **SSO Portal generates RS256-signed token** with:
   - Issuer: `sso-portal`
   - Audience: Your App ID
   - User information in payload
3. **SSO Portal redirects** to: `http://localhost:5001/api/auth/sso/callback?sso_token=...`
4. **IT Management App**:
   - Fetches public key from SSO Portal
   - Validates token with RS256 algorithm
   - Extracts user information
   - Creates/updates user in database
   - Creates local session
   - Redirects to dashboard

### **Key Security Features:**

- ✅ **RS256 Algorithm**: Proper asymmetric key validation
- ✅ **Public Key Caching**: Performance optimization with 5-minute cache
- ✅ **Audience Validation**: Ensures token is for this specific app
- ✅ **Issuer Validation**: Ensures token comes from your SSO Portal
- ✅ **Token Expiry**: Respects JWT expiration times
- ✅ **Just-In-Time Provisioning**: Automatically creates users
- ✅ **Secure Cookies**: HttpOnly, secure session management

## 🧪 **Testing the Fix**

### **Test 1: Direct SSO Callback**
```bash
# Replace YOUR_ACTUAL_TOKEN with a real token from your SSO Portal
curl "http://localhost:5001/api/auth/sso/callback?sso_token=YOUR_ACTUAL_TOKEN"
```

### **Test 2: API Validation**
```bash
curl -X POST http://localhost:5001/api/auth/sso/validate \
  -H "Content-Type: application/json" \
  -d '{"sso_token": "YOUR_ACTUAL_TOKEN"}'
```

### **Test 3: Public Key Fetch**
```bash
curl http://localhost:3001/api/auth/public-key
```

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **"IT_APP_ID is not configured"**
   - Update `IT_APP_ID` in `.env` with actual App ID from SSO database

2. **"Could not fetch SSO public key"**
   - Verify SSO Portal is running on port 3001
   - Check `/api/auth/public-key` endpoint is accessible

3. **"SSO token audience mismatch"**
   - Verify `IT_APP_ID` matches the audience in the token
   - Check SSO Portal is using correct App ID when signing tokens

4. **"SSO token issuer mismatch"**
   - Verify `SSO_ISSUER` in `.env` matches SSO Portal configuration

### **Debug Mode:**

Enable detailed logging by checking console output:
- ✅ Public key fetching
- ✅ Token validation steps
- ✅ User creation/update
- ✅ Session creation
- ✅ Redirect URLs

## 📊 **Expected Console Output**

When working correctly, you should see:
```
🔑 Fetching SSO public key from: http://localhost:3001/api/auth/public-key
✅ Successfully fetched and cached SSO public key.
🔐 Verifying SSO token with: { algorithm: 'RS256', issuer: 'sso-portal', audience: 'YOUR_APP_ID' }
✅ SSO token verified successfully: { userId: '...', userEmail: '...', userRole: '...' }
👤 Extracted user data from SSO token: { userId: '...', userEmail: '...', userName: '...' }
✅ Provisioned new user: user@example.com with role: user
✅ Local session created successfully: { userId: '...', userEmail: '...', userRole: '...' }
🔄 Redirecting user to: http://localhost:5174/dashboard
```

## 🎉 **Success Indicators**

- ✅ No more "Invalid SSO token" errors
- ✅ Users automatically logged in after SSO redirect
- ✅ New users automatically created in IT Management database
- ✅ Existing users updated with latest SSO information
- ✅ Secure session cookies set correctly
- ✅ Proper redirect to dashboard after authentication

Your SSO integration is now properly configured to handle RS256-signed tokens from your SSO Portal!

