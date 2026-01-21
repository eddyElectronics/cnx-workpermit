# 🚀 Deployment Guide - CNX Work Permit System

## Quick Deploy to Vercel

### Step 1: Import Project

1. Go to: https://vercel.com/new
2. Sign in with GitHub
3. Click "Import Git Repository"
4. Search for: `eddyElectronics/cnx-workpermit`
5. Click "Import"

### Step 2: Configure Environment Variables

Copy and paste these variables in Vercel:

```
NEXT_PUBLIC_API_BASE_URL=https://api.airportthai.co.th/proxy/api
NEXT_PUBLIC_API_KEY=LmBuBI2P4IrjEMLHWRrcrgh1TAQ4AwCpoNHQKLIh
NEXT_PUBLIC_DATABASE_NAME=CNXWorkPermit
NEXT_PUBLIC_LINE_CHANNEL_ID=1654076318
LINE_CHANNEL_SECRET=0a137dd5d290e8eafd82df4785f43a79
NEXT_PUBLIC_LINE_LIFF_ID=1654076318-08gnXfNt
LINE_CHANNEL_ACCESS_TOKEN=y+Oz1y/B+nekp6X842NsOOcEzViCxoh9kgvI/VJpTcMyKUZUZO7U6d6wCn686kZPesf3fvyd8bte820ihi1QbXxRvIaKO1ns+3/5oPLNEO8S0IcWGbEu2nEE4JRyTxrWAAKXhb4GvmLOGnvXzMP4nQdB04t89/1O/w1cDnyilFU=
NEXT_PUBLIC_ADMIN_LINE_ID=Ca1c0a4de036ee75233db688646e2168f
NEXT_PUBLIC_APP_NAME=CNX Work Permit System
```

**How to add:**
- Click "Environment Variables" section
- For each variable:
  - Name: (e.g., NEXT_PUBLIC_API_BASE_URL)
  - Value: (copy the value)
  - Click "Add"
- Repeat for all 8 variables

### Step 3: Deploy

1. Click "Deploy" button
2. Wait 2-3 minutes
3. You'll get a URL like: `https://cnx-workpermit.vercel.app`

---

## Post-Deployment Configuration

### A. Update LINE LIFF Endpoint

1. Go to: https://developers.line.biz/console
2. Select Channel ID: `1654076318`
3. Navigate to: **LIFF** tab
4. Click your LIFF app
5. **Endpoint URL:** Change to your Vercel URL
   - Example: `https://cnx-workpermit.vercel.app`
6. Click "Update"

### B. Update App URL Environment Variable

1. Go to Vercel Dashboard
2. Navigate to: **Settings** → **Environment Variables**
3. Find: `NEXT_PUBLIC_APP_URL`
4. Click "Edit"
5. Change from: `https://localhost:3000`
6. Change to: Your Vercel URL (e.g., `https://cnx-workpermit.vercel.app`)
7. Click "Save"
8. Go to **Deployments** tab
9. Click ⋯ (three dots) → **Redeploy**

---

## Testing After Deployment

### On Mobile Phone:

1. ✅ Open the Vercel URL
2. ✅ Click "เข้าสู่ระบบด้วย LINE"
3. ✅ Authorize LINE login
4. ✅ Register user profile
5. ✅ Create work permit with file upload
6. ✅ Check LINE notification (admin should receive)
7. ✅ Login as admin → Approve permit
8. ✅ Preview uploaded documents

### Expected Results:

- LINE login works smoothly
- User registration saves to database
- Work permit creation shows permit number (CNX-P format)
- File upload saves files
- Admin receives LINE notification
- Admin can approve/reject permits
- Images preview in modal

---

## Troubleshooting

### Issue: LINE Login Fails

**Solution:**
- Check LIFF Endpoint URL matches Vercel URL
- Verify all NEXT_PUBLIC_LINE_* variables are set

### Issue: API Connection Failed

**Solution:**
- Check NEXT_PUBLIC_API_BASE_URL is correct
- Verify NEXT_PUBLIC_API_KEY is valid
- Test API endpoint: https://api.airportthai.co.th/proxy/api

### Issue: File Upload Not Working

**Solution:**
- Vercel has limited file system access
- Files are saved to `/tmp` which is ephemeral
- Consider using:
  - AWS S3
  - Cloudinary
  - Vercel Blob Storage

### Issue: Environment Variables Not Working

**Solution:**
- Ensure all variables are added in Vercel
- Variable names must match exactly
- Redeploy after adding/changing variables

---

## Performance Optimization

### Caching Strategy:
- API calls cached for 30 seconds
- Rate limiter: 2 seconds between requests
- Retry logic: 5 attempts with exponential backoff

### Database:
- Use connection pooling
- Enable query caching where possible
- Monitor API rate limits

---

## Custom Domain (Optional)

1. Go to Vercel Dashboard → **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update LINE LIFF Endpoint URL to custom domain

---

## Monitoring

### Check Deployment Logs:
- Vercel Dashboard → **Deployments** → Click deployment
- View **Build Logs** and **Function Logs**

### Monitor Usage:
- Vercel Dashboard → **Analytics**
- Check bandwidth and function invocations

---

## Support

- **GitHub Issues:** https://github.com/eddyElectronics/cnx-workpermit/issues
- **LINE Developer Console:** https://developers.line.biz/console
- **Vercel Support:** https://vercel.com/support

---

## Quick Links

- 🌐 **Production URL:** https://cnx-workpermit.vercel.app (after deployment)
- 📱 **LINE Developers:** https://developers.line.biz/console
- ☁️ **Vercel Dashboard:** https://vercel.com/dashboard
- 📦 **GitHub Repo:** https://github.com/eddyElectronics/cnx-workpermit

---

**Last Updated:** January 21, 2026
