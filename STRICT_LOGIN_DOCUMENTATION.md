# Strict Login System Documentation

## Overview
This document explains the strict login system implementation that prevents cross-portal authentication between Admin and Employee login portals.

## Security Features

### 1. **Portal-Based Authentication**
The system now enforces strict separation between:
- **Admin Portal**: Only users with role `admin` can log in
- **Employee Portal**: Only users with roles `user`, `employee`, or `intern` can log in

### 2. **Multi-Layer Security**

#### Layer 1: Login Validation (Backend)
- **File**: `backend/routes/auth.js`
- **Validation**: Checks if the user's role matches the selected login portal
- **Response**: Returns HTTP 403 with portal mismatch error if roles don't match

```javascript
// Admin Portal: Only admins allowed
if (loginType === 'admin' && !adminRoles.includes(user.role)) {
    return res.status(403).json({ 
        msg: 'Access denied. This portal is for administrators only.',
        portalMismatch: true,
        correctPortal: 'employee'
    });
}

// Employee Portal: Only non-admin users allowed
if (loginType === 'employee' && !employeeRoles.includes(user.role)) {
    return res.status(403).json({ 
        msg: 'Access denied. This portal is for employees only.',
        portalMismatch: true,
        correctPortal: 'admin'
    });
}
```

#### Layer 2: JWT Token Validation (Middleware)
- **File**: `backend/middleware/auth.js`
- **Validation**: Verifies that the `loginType` in the JWT token matches the user's current role
- **Protection**: Prevents token reuse across portals even if someone tries to manipulate cookies

```javascript
// Verify loginType in JWT matches user role
if (decoded.loginType === 'admin' && !adminRoles.includes(req.user.role)) {
    res.cookie('it_app_token', '', { httpOnly: true, expires: new Date(0) });
    return res.status(403).json({ 
        msg: 'Session invalid: Role mismatch detected.',
        sessionInvalid: true
    });
}
```

#### Layer 3: Frontend Error Handling
- **File**: `frontend/src/services/api.js`
- **Feature**: Automatically detects session invalidation and redirects to login
- **User Experience**: Clear error messages and auto-cleanup of invalid sessions

### 3. **User Experience Enhancements**

#### Portal Mismatch Detection
- **File**: `frontend/src/pages/LoginUnified.jsx`
- **Feature**: Displays helpful error message with a button to switch to the correct portal
- **Example**: If an admin tries to log in via Employee portal, they see:
  - Error message: "Access denied. This portal is for employees only. Please use the admin login portal."
  - Button: "Switch to Admin Portal" (automatically switches to correct portal)

#### Session Invalidation Handling
- Detects when a session becomes invalid due to role mismatch
- Automatically clears session storage
- Redirects to login page with appropriate error message
- Prevents confused user experience

## Role Definitions

### Admin Roles
- `admin` - Full administrative access

### Employee Roles
- `user` - Standard user access
- `employee` - Employee access
- `intern` - Intern access

## Testing the Strict Login System

### Test Case 1: Admin Login via Admin Portal ✅
1. Navigate to login page
2. Select "Admin / Technician Portal"
3. Enter admin credentials
4. **Expected**: Successful login

### Test Case 2: Admin Login via Employee Portal ❌
1. Navigate to login page
2. Select "Employee Portal"
3. Enter admin credentials
4. **Expected**: 
   - Error: "Access denied. This portal is for employees only. Please use the admin login portal."
   - Button appears: "Switch to Admin Portal"
   - Clicking button switches to Admin portal

### Test Case 3: Employee Login via Employee Portal ✅
1. Navigate to login page
2. Select "Employee Portal"
3. Enter employee credentials
4. **Expected**: Successful login

### Test Case 4: Employee Login via Admin Portal ❌
1. Navigate to login page
2. Select "Admin / Technician Portal"
3. Enter employee credentials
4. **Expected**:
   - Error: "Access denied. This portal is for administrators only. Please use the employee login portal."
   - Button appears: "Switch to Employee Portal"
   - Clicking button switches to Employee portal

### Test Case 5: Token Manipulation ❌
1. Log in as employee via Employee portal
2. Manually change user role in sessionStorage to 'admin'
3. Try to access admin-only resources
4. **Expected**: 
   - JWT validation fails (role in token doesn't match role in database)
   - Session invalidated
   - Redirected to login with error message

### Test Case 6: Cross-Portal Token Reuse ❌
1. Log in as admin via Admin portal
2. Get the session token from cookies
3. Try to use the same token to access system as if logged in via Employee portal
4. **Expected**:
   - Middleware detects loginType mismatch
   - Session invalidated
   - Redirected to login

## Security Best Practices Implemented

1. ✅ **Validation at Login**: Check role vs portal on initial authentication
2. ✅ **Token-Based Validation**: Include loginType in JWT for continuous validation
3. ✅ **Middleware Protection**: Validate every protected request
4. ✅ **Session Cleanup**: Clear invalid sessions immediately
5. ✅ **User Feedback**: Clear error messages guide users to correct portal
6. ✅ **No Credential Leakage**: Generic error messages for invalid credentials

## Files Modified

### Backend
1. `backend/routes/auth.js` - Added portal validation logic
2. `backend/middleware/auth.js` - Added JWT loginType validation

### Frontend
1. `frontend/src/pages/LoginUnified.jsx` - Enhanced error handling and portal switching
2. `frontend/src/services/api.js` - Added session invalidation handling

## Configuration

### Role Configuration
To modify which roles can access which portal, update the role arrays in:

1. **Login Route** (`backend/routes/auth.js`):
```javascript
const adminRoles = ['admin'];
const employeeRoles = ['user', 'employee', 'intern'];
```

2. **Auth Middleware** (`backend/middleware/auth.js`):
```javascript
const adminRoles = ['admin'];
const employeeRoles = ['user', 'employee', 'intern'];
```

**Note**: Keep these arrays synchronized across both files for consistency.

## Troubleshooting

### Issue: Users can still cross-login
**Solution**: 
- Ensure backend server is restarted
- Clear browser cookies and session storage
- Verify both files have the same role definitions

### Issue: Valid users getting rejected
**Solution**:
- Check user role in database matches expected values
- Verify role is in the correct array (adminRoles or employeeRoles)
- Check JWT_SECRET is consistent

### Issue: Session not invalidating
**Solution**:
- Check middleware is properly applied to routes
- Verify JWT token includes loginType field
- Check browser console for error messages

## Next Steps

To restart the backend server and test the implementation, run:
```bash
cd backend
node server.js
```

Then test the login flows described in the test cases above.


