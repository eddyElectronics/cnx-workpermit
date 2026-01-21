# API Connection Error - Troubleshooting Guide

## 🔴 Current Issue
**Error**: AxiosError - Network Error  
**Location**: `lib/api.ts:19:22` → `app/page.tsx:29:23`  
**Context**: Occurs during LIFF initialization when checking if user is registered

## 🔍 Root Causes

### 1. **CORS (Cross-Origin Resource Sharing) Issue** ⭐ Most Likely
The API server at `https://api.airportthai.co.th/proxy/api` may not allow requests from `https://localhost:3000`.

**Symptoms:**
- Network Error in console
- No response from server
- CORS error in browser dev tools

**Solutions:**
- ✅ **Temporary Fix Applied**: Added try-catch to allow development without API
- 🔧 **Backend Fix Needed**: API server must add CORS headers:
  ```
  Access-Control-Allow-Origin: https://localhost:3000
  Access-Control-Allow-Methods: POST, GET, OPTIONS
  Access-Control-Allow-Headers: Content-Type, x-api-key
  ```

### 2. **Network Connectivity**
The API endpoint might not be accessible from your network.

**Test:**
```bash
# Test API connectivity
curl -X POST https://api.airportthai.co.th/proxy/api/query \
  -H "Content-Type: application/json" \
  -H "x-api-key: LmBuBI2P4IrjEMLHWRrcrgh1TAQ4AwCpoNHQKLIh" \
  -d '{"database":"CNXWorkPermit","query":"SELECT 1 AS Test","parameters":{}}'
```

**Check:**
- Can you access `https://api.airportthai.co.th` in browser?
- Is your firewall blocking the connection?
- Is VPN required to access the API?

### 3. **API Configuration Issues**
Invalid API key or incorrect endpoint.

**Verify:**
- API Key: `LmBuBI2P4IrjEMLHWRrcrgh1TAQ4AwCpoNHQKLIh`
- Database: `CNXWorkPermit`
- Endpoint: `https://api.airportthai.co.th/proxy/api`

## 🛠️ Diagnostic Tools

### Built-in Test Page
Visit: https://localhost:3000/api-test

This page will:
- Display current API configuration
- Test connection to API
- Show detailed error information
- Provide troubleshooting suggestions

### Configuration Check
Visit: https://localhost:3000/api/diagnostics

Returns JSON with current configuration.

### Browser Console
Open Developer Tools (F12) and check:
1. **Console tab**: Look for CORS or network errors
2. **Network tab**: Check if request is sent and response received
3. **Request details**: Verify headers and payload

## ✅ Temporary Workaround Applied

The application now works in **development mode** even without API connectivity:

```typescript
// When API fails, user can still proceed to registration
try {
  const users = await apiService.getUserByLineId(profile.userId)
  // ... normal flow
} catch (apiError) {
  console.warn('Proceeding without API verification - development mode')
  router.push('/register')  // Allow user to register anyway
}
```

This allows you to:
- ✅ Test LINE LIFF integration
- ✅ Test UI/UX flows
- ✅ Develop frontend features
- ⚠️ Cannot save/retrieve data (API calls will fail)

## 🔧 Solutions by Priority

### Option 1: Fix CORS on API Server (Recommended for Production)
Contact backend team to add CORS headers for your domain.

### Option 2: Use API Proxy (Quick Development Fix)
Create a Next.js API route that proxies requests:

```typescript
// app/api/proxy/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  
  const response = await fetch('https://api.airportthai.co.th/proxy/api/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.NEXT_PUBLIC_API_KEY!,
    },
    body: JSON.stringify(body),
  })
  
  const data = await response.json()
  return NextResponse.json(data)
}
```

Then update `lib/api.ts` to use `/api/proxy` instead of external API.

### Option 3: Use ngrok or Similar Tunnel
Deploy to a public HTTPS domain that the API server allows.

### Option 4: Mock API Responses (Development Only)
Create mock data for development:

```typescript
// lib/api-mock.ts
export const mockApiService = {
  getUserByLineId: async (lineUserId: string) => {
    return [] // Empty = not registered
  },
  // ... other mock functions
}
```

## 📊 Current Status

- ✅ HTTPS server running on port 3000
- ✅ SSL certificate configured
- ✅ LINE LIFF configuration ready
- ✅ Error handling improved
- ⚠️ API connectivity needs resolution
- ⚠️ Database operations will fail until API is accessible

## 🎯 Next Steps

1. **Test API connectivity** using curl or api-test page
2. **Check browser console** for specific CORS/network errors
3. **Contact backend team** if CORS fix is needed
4. **Consider using API proxy** for development
5. **Test with mock data** if backend is not ready

## 📞 Need Help?

Check these resources:
- Browser Dev Tools (F12) → Console & Network tabs
- API Test Page: https://localhost:3000/api-test
- Diagnostics API: https://localhost:3000/api/diagnostics
- Server logs in terminal

---

**Updated**: January 21, 2026  
**Status**: API connection error - temporary workaround in place
