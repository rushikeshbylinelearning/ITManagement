# Environment Configuration Guide

## Required Environment Variables

Create a `.env` file in the `it-managaement-app/backend` directory with the following variables:

### Development Configuration
```bash
# Server Configuration
NODE_ENV=development
PORT=5002
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=8h

# Database Configuration
MONGO_URI=mongodb://localhost:27017/it-management

# Frontend Configuration
FRONTEND_URL=http://localhost:5173

# SSO Configuration
SSO_ISSUER=sso-portal
SSO_AUDIENCE=sso-apps
SSO_PUBLIC_KEY=your-sso-public-key-here
SSO_API_URL=http://localhost:5000
SSO_PORTAL_URL=http://localhost:5000

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,http://localhost:3000,https://itmanagement.bylinelms.com
```

### Production Configuration
```bash
# Server Configuration
NODE_ENV=production
PORT=5002
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=8h

# Database Configuration
MONGO_URI=mongodb://your-production-mongo-uri

# Frontend Configuration
FRONTEND_URL=https://itmanagement.bylinelms.com

# SSO Configuration
SSO_ISSUER=sso-portal
SSO_AUDIENCE=sso-apps
SSO_JWKS_URI=https://sso.bylinelms.com/.well-known/jwks.json
SSO_API_URL=https://sso.bylinelms.com
SSO_PORTAL_URL=https://sso.bylinelms.com

# CORS Configuration
CORS_ORIGIN=https://itmanagement.bylinelms.com,https://sso.bylinelms.com
```

## Frontend Environment Variables

Create a `.env` file in the `it-managaement-app/frontend` directory:

### Development Configuration
```bash
VITE_API_URL=http://localhost:5002/api
VITE_SSO_API_URL=http://localhost:5000
VITE_SSO_PORTAL_URL=http://localhost:5000
```

### Production Configuration
```bash
VITE_API_URL=https://itmanagement.bylinelms.com/api
VITE_SSO_API_URL=https://sso.bylinelms.com
VITE_SSO_PORTAL_URL=https://sso.bylinelms.com
```

## SSO Portal Environment Variables

Create a `.env` file in the `SSO/backend` directory:

### Development Configuration
```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sso-portal
JWT_SECRET=your-sso-jwt-secret-here
SSO_PORTAL_URL=http://localhost:5000
FRONTEND_ORIGIN=http://localhost:5173
```

### Production Configuration
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-production-mongo-uri
JWT_SECRET=your-sso-jwt-secret-here
SSO_PORTAL_URL=https://sso.bylinelms.com
FRONTEND_ORIGIN=https://sso.bylinelms.com
```

## Port Configuration Summary

- **SSO Portal**: Port 5000 (both dev and prod)
- **IT Management Backend**: Port 5002 (both dev and prod)
- **IT Management Frontend**: Port 5173 (dev only, served from domain in prod)

## Important Notes

1. **JWT Secrets**: Use strong, unique secrets for both applications
2. **CORS**: Ensure all necessary origins are included in CORS configuration
3. **Database**: Use separate databases for development and production
4. **SSL**: Production environments should use HTTPS
5. **Environment Variables**: Never commit `.env` files to version control

