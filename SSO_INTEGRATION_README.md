# SSO Integration - Complete Setup Guide

This document provides a comprehensive guide for setting up and testing the Single Sign-On (SSO) integration between the SSO Portal and the IT Management App.

## Overview

The SSO integration allows users to authenticate once through the SSO Portal and access the IT Management App without re-entering credentials. The flow works as follows:

1. User accesses IT Management App
2. If not authenticated, user is redirected to SSO Portal
3. User logs in through SSO Portal
4. SSO Portal generates a JWT token and redirects back to IT Management App
5. IT Management App validates the token and establishes a local session
6. User is redirected to the dashboard

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SSO Portal    │    │ IT Management   │    │ IT Management   │
│   (Port 5000)   │◄──►│    Backend      │◄──►│    Frontend     │
│                 │    │   (Port 5002)   │    │   (Port 5173)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Environment Setup

### 1. SSO Portal Configuration

**Development:**
```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sso-portal
JWT_SECRET=your-sso-jwt-secret-here
SSO_PORTAL_URL=http://localhost:5000
FRONTEND_ORIGIN=http://localhost:5173
```

**Production:**
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-production-mongo-uri
JWT_SECRET=your-sso-jwt-secret-here
SSO_PORTAL_URL=https://sso.bylinelms.com
FRONTEND_ORIGIN=https://sso.bylinelms.com
```

### 2. IT Management Backend Configuration

**Development:**
```bash
NODE_ENV=development
PORT=5002
JWT_SECRET=your-it-management-jwt-secret-here
JWT_EXPIRE=8h
MONGO_URI=mongodb://localhost:27017/it-management
FRONTEND_URL=http://localhost:5173
SSO_ISSUER=sso-portal
SSO_AUDIENCE=sso-apps
SSO_API_URL=http://localhost:5000
SSO_PORTAL_URL=http://localhost:5000
```

**Production:**
```bash
NODE_ENV=production
PORT=5002
JWT_SECRET=your-it-management-jwt-secret-here
JWT_EXPIRE=8h
MONGO_URI=mongodb://your-production-mongo-uri
FRONTEND_URL=https://itmanagement.bylinelms.com
SSO_ISSUER=sso-portal
SSO_AUDIENCE=sso-apps
SSO_JWKS_URI=https://sso.bylinelms.com/.well-known/jwks.json
SSO_API_URL=https://sso.bylinelms.com
SSO_PORTAL_URL=https://sso.bylinelms.com
```

### 3. IT Management Frontend Configuration

**Development:**
```bash
VITE_API_URL=http://localhost:5002/api
VITE_SSO_API_URL=http://localhost:5000
VITE_SSO_PORTAL_URL=http://localhost:5000
```

**Production:**
```bash
VITE_API_URL=https://itmanagement.bylinelms.com/api
VITE_SSO_API_URL=https://sso.bylinelms.com
VITE_SSO_PORTAL_URL=https://sso.bylinelms.com
```

## Token Structure

The SSO Portal generates JWT tokens with the following structure:

```json
{
  "sub": "user-id",
  "iss": "sso-portal",
  "aud": "app-id",
  "iat": 1234567890,
  "exp": 1234567890,
  "employeeId": "EMP001",
  "user": {
    "id": "user-id",
    "employeeId": "EMP001",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "employee",
    "department": "IT",
    "position": "Developer"
  },
  "app": {
    "id": "app-id",
    "name": "IT Management",
    "url": "https://itmanagement.bylinelms.com"
  }
}
```

## API Endpoints

### SSO Portal Endpoints

- `GET /health` - Health check
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/validate` - Validate token
- `GET /api/auth/jwks` - JSON Web Key Set

### IT Management App Endpoints

- `GET /api/health` - Health check
- `GET /api/auth/callback` - SSO callback handler
- `POST /api/auth/validate` - Validate SSO token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

## Testing the Integration

### 1. Automated Testing

Run the comprehensive test suite:

```bash
cd it-managaement-app/backend
node scripts/testSSOIntegration.js
```

This will test:
- SSO Portal health
- IT Management backend health
- SSO token validation
- SSO callback flow

### 2. Manual Testing

1. **Start the services:**
   ```bash
   # Terminal 1: SSO Portal
   cd SSO/backend
   npm start
   
   # Terminal 2: IT Management Backend
   cd it-managaement-app/backend
   npm start
   
   # Terminal 3: IT Management Frontend
   cd it-managaement-app/frontend
   npm run dev
   ```

2. **Test the flow:**
   - Open browser to `http://localhost:5173`
   - You should be redirected to SSO Portal login
   - Login with valid credentials
   - You should be redirected back to IT Management App dashboard

### 3. Test URLs

The test script generates URLs for manual testing:

- **Complete SSO Flow:** `http://localhost:5173?sso_token=TOKEN&return_url=/dashboard`
- **Direct SSO Callback:** `http://localhost:5173/auth/callback?sso_token=TOKEN&return_url=/dashboard`
- **SSO Portal Login:** `http://localhost:5000/login`
- **IT Management Dashboard:** `http://localhost:5173/dashboard`

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure CORS_ORIGIN includes all necessary domains
   - Check that frontend and backend URLs are correctly configured

2. **Token Validation Failures**
   - Verify JWT_SECRET is the same in both applications
   - Check token expiration time
   - Ensure SSO_ISSUER and SSO_AUDIENCE match

3. **Redirect Loops**
   - Check that callback URLs are correctly configured
   - Verify environment variables are set correctly
   - Ensure ports are not conflicting

4. **Database Connection Issues**
   - Verify MongoDB is running
   - Check MONGO_URI configuration
   - Ensure database permissions are correct

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=sso:*
NODE_ENV=development
```

### Logs

Check the following log locations:
- SSO Portal: Console output
- IT Management Backend: Console output
- Browser: Developer Tools Console

## Security Considerations

1. **JWT Secrets:** Use strong, unique secrets for each environment
2. **HTTPS:** Always use HTTPS in production
3. **Token Expiration:** Keep token expiration times reasonable (15 minutes for access tokens)
4. **CORS:** Restrict CORS origins to necessary domains only
5. **Environment Variables:** Never commit `.env` files to version control

## Production Deployment

1. **Set up SSL certificates** for both domains
2. **Configure reverse proxy** (nginx/Apache) if needed
3. **Set up monitoring** and logging
4. **Configure backup** for databases
5. **Test thoroughly** in staging environment before production

## Support

For issues or questions:
1. Check the logs for error messages
2. Run the test suite to identify specific failures
3. Verify environment configuration
4. Check network connectivity between services

