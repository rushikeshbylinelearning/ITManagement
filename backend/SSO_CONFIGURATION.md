# SSO Configuration Guide

## Environment Variables

Add the following environment variables to your `.env` file:

```bash
# SSO Configuration (Development)
SSO_ISSUER=sso-portal
SSO_AUDIENCE=sso-apps
SSO_PUBLIC_KEY=your-sso-public-key-here
SSO_API_URL=http://localhost:5000
SSO_PORTAL_URL=http://localhost:5000

# For Production with JWKS
# SSO_JWKS_URI=https://sso.bylinelms.com/.well-known/jwks.json
# SSO_API_URL=https://sso.bylinelms.com
# SSO_PORTAL_URL=https://sso.bylinelms.com
```

**Note**: The current implementation uses HS256 algorithm for development/testing. For production, you should implement proper RS256 with JWKS verification.

## Configuration Details

### SSO_JWKS_URI
- **Purpose**: URL to your SSO portal's JSON Web Key Set (JWKS) endpoint
- **Format**: `https://your-sso-portal.com/.well-known/jwks.json`
- **Example**: `https://auth.company.com/.well-known/jwks.json`

### SSO_ISSUER
- **Purpose**: The issuer identifier that will be validated in JWT tokens
- **Format**: `https://your-sso-portal.com`
- **Example**: `https://auth.company.com`

### SSO_AUDIENCE
- **Purpose**: The audience identifier that will be validated in JWT tokens
- **Format**: Any string identifier for your IT Management portal
- **Example**: `it-management-portal`

## JWT Token Structure

The SSO system expects JWT tokens with the following claims:

```json
{
  "sub": "user-id",
  "email": "user@company.com",
  "name": "John Doe",
  "role": "employee",
  "employee_id": "EMP001",
  "domain": "company.com",
  "iss": "https://your-sso-portal.com",
  "aud": "it-management-portal",
  "exp": 1234567890,
  "iat": 1234567890
}
```

## User Role Mapping

The system maps SSO roles to internal roles as follows:
- If no role is provided in the token, defaults to `user`
- Supported roles: `admin`, `technician`, `employee`, `intern`, `user`

## Testing SSO Integration

1. **Generate a test JWT token** with your SSO portal
2. **Access the IT Management portal** with the token:
   ```
   http://localhost:3000?sso_token=YOUR_JWT_TOKEN&return_url=/dashboard
   ```
3. **Verify authentication** by checking if you're redirected to the dashboard

## Security Considerations

- JWT tokens are validated using the SSO portal's public key
- Token expiry is enforced (respects `exp` claim)
- Tokens are only accepted from the configured issuer
- All SSO tokens are validated before creating local sessions
