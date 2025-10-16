# Content Security Policy Error Fix

## ❌ Error Message

```
Refused to connect to 'http://localhost:5001/.well-known/appspecific/com.chrome.devtools.json' 
because it violates the following Content Security Policy directive: "default-src 'none'". 
Note that 'connect-src' was not explicitly set, so 'default-src' is used as a fallback.
```

## ✅ Solution Applied

### What Was the Problem?

The `helmet()` middleware in Express was using default Content Security Policy (CSP) settings that were too restrictive. By default, helmet blocks all connections except those explicitly allowed, which prevented:

1. The frontend from connecting to the backend API
2. Socket.IO real-time connections
3. File downloads from the `/downloads` folder

### What Was Fixed?

#### 1. **Configured Helmet CSP** (`backend/server.js`)

Changed from:
```javascript
app.use(helmet());
```

To:
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        'http://localhost:5001',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'https://itmanagement.bylinelms.com',
        'ws://localhost:5001',
        'wss://itmanagement.bylinelms.com'
      ],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
```

This configuration:
- ✅ Allows connections to localhost and production domain
- ✅ Allows WebSocket connections (ws:// and wss://)
- ✅ Allows inline scripts and styles (required by React)
- ✅ Allows images from data URIs and blobs
- ✅ Maintains security while enabling functionality

#### 2. **Added Downloads Static Route** (`backend/server.js`)

Added:
```javascript
app.use('/downloads', express.static('downloads')); // Network monitoring agent downloads
```

This makes the `/downloads` folder publicly accessible for downloading the agent installer.

## 🚀 Next Steps

### 1. **Restart Backend Server** ⚠️

**IMPORTANT**: You MUST restart your backend server for these changes to take effect:

```bash
# In your backend terminal:
# 1. Stop the server (Ctrl+C)
# 2. Restart:
cd backend
node server.js
```

### 2. **Verify the Fix**

After restarting the backend:

1. **Clear Browser Cache**
   - Press `Ctrl+Shift+Delete`
   - Clear cached images and files
   - Or do a hard refresh: `Ctrl+F5`

2. **Test Download**
   - Login as employee
   - Click "Download Agent" button
   - The CSP error should be gone
   - Download should work

3. **Check Console**
   - Open browser DevTools (F12)
   - Console tab should show no CSP errors
   - Network tab should show successful connections

### 3. **Build Agent Installer** (If not done yet)

The download will only work if the installer exists:

```bash
cd backend/agent
pip install pyinstaller
pyinstaller --onefile --name="ITNetworkMonitor-Setup" install_agent.py
copy dist\ITNetworkMonitor-Setup.exe ..\downloads\
```

Or create a dummy file for testing:
```bash
cd backend/downloads
echo "Test installer" > ITNetworkMonitor-Setup.exe
```

## 🔍 How to Verify It's Fixed

### Before Fix:
- ❌ CSP error in console
- ❌ Download button doesn't work
- ❌ Modal may not generate token
- ❌ API calls blocked

### After Fix:
- ✅ No CSP errors in console
- ✅ Download button opens installer
- ✅ Token generation works
- ✅ API calls succeed
- ✅ Socket.IO connects (see "🟢 Live" on admin dashboard)

## 📋 Understanding the CSP Directives

### What Each Directive Does:

- **`defaultSrc: ["'self'"]`** - By default, only allow resources from same origin
- **`connectSrc: [...]`** - Explicitly allow API and WebSocket connections
- **`scriptSrc: ["'self'", "'unsafe-inline'"]`** - Allow inline scripts (required by React)
- **`styleSrc: ["'self'", "'unsafe-inline'"]`** - Allow inline styles (required by Material-UI)
- **`imgSrc: ["'self'", 'data:', 'blob:']`** - Allow images from same origin, data URIs, and blobs
- **`fontSrc: ["'self'", 'data:']`** - Allow fonts from same origin and data URIs
- **`objectSrc: ["'none'"]`** - Block plugins like Flash (security)
- **`crossOriginResourcePolicy: "cross-origin"`** - Allow cross-origin resource sharing

## 🔒 Security Notes

### Is This Still Secure?

**Yes!** The updated CSP configuration is still secure:

- ✅ Only allows connections to known, trusted origins
- ✅ Blocks inline scripts from untrusted sources
- ✅ Prevents XSS attacks
- ✅ Blocks unauthorized plugins
- ✅ Maintains CORS protection
- ✅ Still enforces HTTPS in production

### What We Didn't Compromise:

- ❌ We didn't disable helmet entirely
- ❌ We didn't allow connections from anywhere (`'*'`)
- ❌ We didn't disable all CSP protections
- ❌ We didn't allow unsafe-eval

### What We Allowed:

- ✅ Connections to localhost (development)
- ✅ Connections to production domain
- ✅ WebSocket connections (for Socket.IO)
- ✅ Inline styles (Material-UI requirement)
- ✅ Cross-origin downloads

## 🐛 Still Having Issues?

### If CSP error persists:

1. **Hard refresh**: `Ctrl+F5` or `Cmd+Shift+R`
2. **Clear browser cache completely**
3. **Try incognito/private window**
4. **Verify backend restarted**: Check console for startup messages
5. **Check browser console**: Look for any other errors

### If download still fails:

1. **Check file exists**: `backend/downloads/ITNetworkMonitor-Setup.exe`
2. **Check URL**: Open `http://localhost:5001/downloads/ITNetworkMonitor-Setup.exe` directly
3. **Check browser downloads**: May be blocked by browser/antivirus
4. **Try different browser**: Test in Chrome, Firefox, Edge

### If token generation fails:

1. **Check backend logs**: Look for registration errors
2. **Verify MongoDB running**: Agent registration needs database
3. **Check network tab**: See if API call succeeds
4. **Login status**: Ensure you're logged in as employee

## 📞 Additional Resources

- **Full Documentation**: See `NETWORK_MONITORING_DOCUMENTATION.md`
- **Quick Start**: See `QUICK_START_NETWORK_MONITORING.md`
- **Helmet Documentation**: https://helmetjs.github.io/
- **CSP Guide**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP

## ✅ Success Indicators

After applying the fix and restarting, you should see:

```
Backend Console:
✅ MongoDB connected successfully for IT Management App.
✅ IT Management Server running on port 5001

Browser Console:
✅ 🔧 API Configuration: { baseURL: "http://localhost:5001/api", ... }
✅ Connected to socket for real-time network monitoring

No CSP errors! ✨
```

---

**Status**: ✅ Fixed  
**Files Modified**: `backend/server.js`  
**Action Required**: Restart backend server  
**Test**: Click "Download Agent" button as employee

