# HTTPS Configuration

## ✅ HTTPS Setup Complete!

Your CNX Work Permit application is now running on:
- **URL**: https://localhost:3000
- **Protocol**: HTTPS (Secure)
- **Port**: 3000
- **Environment**: Development

## 📜 Certificate Details

- **Type**: Self-signed certificate
- **Location**: `certificates/localhost.pfx`
- **Passphrase**: `password`
- **Valid For**: 1 year
- **Common Name**: localhost

## 🚀 Running the Application

### Start HTTPS Server (Port 3000)
```bash
npm run dev
```

### Start HTTP Server (if needed)
```bash
npm run dev:http
```

## ⚠️ Browser Security Warning

When you first visit https://localhost:3000, you'll see a security warning because the certificate is self-signed. This is normal for development.

### How to Proceed:

**Chrome/Edge:**
1. Click "Advanced"
2. Click "Proceed to localhost (unsafe)"

**Firefox:**
1. Click "Advanced"
2. Click "Accept the Risk and Continue"

## 🔧 Technical Details

### Server Configuration
- Custom Node.js HTTPS server (`server.js`)
- Uses Windows Certificate Store
- Automatically loads PFX certificate
- Integrates with Next.js development server

### Files Created
- `server.js` - Custom HTTPS server
- `certificates/localhost.pfx` - SSL certificate (PFX format)
- `certificates/localhost-key.pem` - Private key (if generated)
- `certificates/localhost.pem` - Certificate (if generated)

## 🔐 Security Notes

### For Development
✅ Self-signed certificate is perfect for local development
✅ Certificate is stored locally
✅ No external CA needed

### For Production
⚠️ Use proper CA-signed certificates (Let's Encrypt, etc.)
⚠️ Update `server.js` to use production certificates
⚠️ Configure proper SSL/TLS settings
⚠️ Enable HTTPS strict transport security (HSTS)

## 📱 LINE LIFF Configuration

**Important**: When deploying to production, update your LINE LIFF Endpoint URL to use HTTPS:

1. Go to [LINE Developers Console](https://developers.line.biz/console/)
2. Select your channel
3. Go to LIFF tab
4. Update Endpoint URL to: `https://your-domain.com`

For development, LIFF may require:
- ngrok or similar tunneling service for external HTTPS access
- Or deploy to a staging environment with proper SSL

## 🛠️ Troubleshooting

### Port 3000 Already in Use
```bash
# Find process using port 3000
netstat -ano | Select-String ":3000"

# Kill the process (replace PID)
taskkill /F /PID <process_id>
```

### Certificate Not Found
The certificate is automatically created when you first run the setup. If missing:
```powershell
$cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "cert:\CurrentUser\My" -NotAfter (Get-Date).AddYears(1)
```

### HTTPS Not Working
1. Check certificate file exists: `certificates/localhost.pfx`
2. Verify server.js is correctly configured
3. Check console for error messages
4. Ensure port 3000 is not blocked by firewall

## 📊 Performance

HTTPS adds minimal overhead in development:
- ~1-2ms additional latency
- Certificate validation only on initial connection
- Hot reload still works normally

## 🎯 Next Steps

1. ✅ HTTPS server is running on port 3000
2. ✅ Self-signed certificate configured
3. ⏳ Test LINE LIFF integration (may need external URL)
4. ⏳ Deploy to staging/production with proper SSL

---

**Last Updated**: January 20, 2026  
**Configuration**: Development HTTPS with self-signed certificate
