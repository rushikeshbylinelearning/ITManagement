# SSO Integration Guide for IT Management Application

## Overview

This guide provides complete instructions for integrating the IT Management Application with the SSO Portal. The integration allows users to authenticate through the SSO Portal and automatically access the IT Management Application without separate login credentials.

## Architecture

The SSO integration follows this flow:

1. **User clicks "Login with SSO Portal"** on the IT Management Application login page
2. **Redirect to SSO Portal** with return URL pointing back to IT Management App
3. **User authenticates** on the SSO Portal
4. **SSO Portal generates JWT token** and redirects back to IT Management App
5. **IT Management App validates token** with SSO Portal
6. **Local session created** and user is logged in

## Implementation Status

✅ **Completed Components:**

### Backend Implementation
- **SSO Middleware** (`backend/middleware/sso.js`): JWT token validation and user handling
- **SSO Routes** (`backend/routes/auth.js`): 
  - `/api/auth/callback` - Handles SSO redirect with token validation
  - `/api/auth/sso` - API endpoint for SSO authentication
  - `/api/auth/validate` - Validates SSO tokens
- **User Model** (`backend/models/User.js`): Supports SSO user creation and mapping
- **Logout Flow**: Redirects to SSO Portal for global logout

### Frontend Implementation
- **SSO Login Button**: Added to login page with proper styling
- **SSO Callback Component** (`frontend/src/pages/SSOCallback.jsx`): Handles SSO redirect processing
- **Routing**: SSO callback route configured in App.jsx
- **Environment Configuration**: Template files created for easy setup

## Setup Instructions

### 1. Backend Environment Configuration

Create a `.env` file in the `backend/` directory using the template:

```bash
# Copy the template
cp backend/env.template backend/.env
```

Update the following values in `backend/.env`:

```env
# SSO Configuration
SSO_ISSUER=sso-portal
SSO_AUDIENCE=sso-apps
SSO_PUBLIC_KEY=your-sso-public-key-here
SSO_JWKS_URI=http://localhost:5000/.well-known/jwks.json
SSO_API_URL=http://localhost:5000
SSO_PORTAL_URL=http://localhost:5000
```

### 2. Frontend Environment Configuration

Create a `.env` file in the `frontend/` directory:

```bash
# Copy the template
cp frontend/env.template frontend/.env
```

Update the following values in `frontend/.env`:

```env
# SSO Configuration
VITE_SSO_API_URL=http://localhost:5000
VITE_SSO_PORTAL_URL=http://localhost:5000
```

### 3. Install Dependencies

Install the required dependencies:

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 4. SSO Portal Configuration

Ensure your SSO Portal is configured with:

- **JWT Secret**: Must match the `SSO_PUBLIC_KEY` in IT Management App
- **Issuer**: Must match `SSO_ISSUER` 
- **Audience**: Must match `SSO_AUDIENCE`
- **Application Registration**: IT Management App must be registered in SSO Portal

## Usage

### For Users

1. **Direct Login**: Users can still use the traditional email/password login
2. **SSO Login**: Users can click "Login with SSO Portal" to authenticate via SSO
3. **Seamless Experience**: After SSO authentication, users are automatically logged into IT Management App

### For Administrators

1. **User Provisioning**: New users are automatically created when they first login via SSO
2. **Role Mapping**: User roles from SSO Portal are mapped to IT Management App roles
3. **Global Logout**: Logout from IT Management App also logs out from SSO Portal

## API Endpoints

### SSO Authentication Endpoints

- `GET /api/auth/callback` - SSO callback handler
- `POST /api/auth/sso` - SSO authentication API
- `POST /api/auth/validate` - SSO token validation
- `GET /api/auth/logout` - Logout with SSO redirect

### Frontend Routes

- `/auth/callback` - SSO callback processing page
- `/login` - Login page with SSO option

## Security Features

1. **JWT Token Validation**: All SSO tokens are validated against SSO Portal
2. **Secure Cookies**: Authentication cookies are HttpOnly and secure
3. **CORS Protection**: Proper CORS configuration for cross-origin requests
4. **Rate Limiting**: API endpoints are rate-limited to prevent abuse
5. **Token Expiry**: SSO tokens are short-lived and single-use

## Troubleshooting

### Common Issues

1. **SSO Token Validation Fails**
   - Check JWT secret configuration
   - Verify SSO Portal is running and accessible
   - Check network connectivity between applications

2. **User Not Created**
   - Verify user data is being passed correctly from SSO Portal
   - Check database connection
   - Review SSO middleware logs

3. **Redirect Issues**
   - Verify return URLs are properly encoded
   - Check CORS configuration
   - Ensure frontend and backend URLs are correct

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

This will provide detailed console logs for SSO authentication flow.

## Production Deployment

### Environment Variables

Update environment variables for production:

```env
# Backend Production
NODE_ENV=production
SSO_PORTAL_URL=https://sso.yourdomain.com
SSO_API_URL=https://sso.yourdomain.com
SSO_JWKS_URI=https://sso.yourdomain.com/.well-known/jwks.json

# Frontend Production
VITE_SSO_PORTAL_URL=https://sso.yourdomain.com
VITE_SSO_API_URL=https://sso.yourdomain.com
```

### Security Considerations

1. **HTTPS**: Use HTTPS in production for all communications
2. **JWT Secrets**: Use strong, unique secrets for production
3. **Domain Configuration**: Set proper cookie domains for production
4. **CORS**: Restrict CORS origins to production domains only

## Support

For issues or questions regarding SSO integration:

1. Check the console logs for detailed error messages
2. Verify environment configuration
3. Test SSO Portal connectivity
4. Review the troubleshooting section above

## Files Modified/Created

### Backend Files
- `backend/middleware/sso.js` - SSO middleware (existing)
- `backend/routes/auth.js` - Updated with SSO routes and logout flow
- `backend/models/User.js` - User model (existing, SSO-compatible)
- `backend/package.json` - Added axios dependency
- `backend/env.template` - Environment configuration template

### Frontend Files
- `frontend/src/pages/LoginUnified.jsx` - Added SSO login button
- `frontend/src/pages/SSOCallback.jsx` - SSO callback handler (existing)
- `frontend/src/styles/LoginUnified.css` - Added SSO button styles
- `frontend/src/App.jsx` - SSO routing (existing)
- `frontend/env.template` - Environment configuration template

### Documentation
- `SSO_INTEGRATION_GUIDE.md` - This comprehensive guide
- `ENVIRONMENT_CONFIGURATION.md` - Updated with SSO configuration


