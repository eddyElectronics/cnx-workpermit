# CNX Work Permit System - Setup Guide

## 📋 ข้อมูลการ Deploy

### 1. ติดตั้ง Dependencies
```bash
cd e:\SourceControl\cnx-workpermit
npm install
```

### 2. ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local` ในโฟลเดอร์หลัก:

```env
# Database API
NEXT_PUBLIC_API_BASE_URL=https://api.airportthai.co.th/proxy/api
NEXT_PUBLIC_API_KEY=LmBuBI2P4IrjEMLHWRrcrgh1TAQ4AwCpoNHQKLIh
NEXT_PUBLIC_DATABASE_NAME=CNXWorkPermit

# LINE Configuration
NEXT_PUBLIC_LINE_CHANNEL_ID=1654076318
LINE_CHANNEL_SECRET=your-channel-secret
NEXT_PUBLIC_LINE_LIFF_ID=1654076318-08gnXfNt
LINE_CHANNEL_ACCESS_TOKEN=your-access-token

# Admin LINE ID
NEXT_PUBLIC_ADMIN_LINE_ID=Cbf8c6d2e6287a5d59c5e9262e0321d2a

# App Configuration
NEXT_PUBLIC_APP_NAME=CNX Work Permit System
NEXT_PUBLIC_APP_URL=https://liff.line.me/1654076318-08gnXfNt
```

### 3. Deploy Database
ใช้ไฟล์ `database/deploy_all_in_one.sql` สำหรับสร้างฐานข้อมูลใน SQL Server:

```sql
-- 1. เปิด SQL Server Management Studio (SSMS)
-- 2. สร้าง Database ชื่อ CNXWorkPermit
CREATE DATABASE CNXWorkPermit;
GO

USE CNXWorkPermit;
GO

-- 3. รันไฟล์ deploy_all_in_one.sql ทั้งหมด
```

### 4. รันแอปพลิเคชัน

#### Development Mode
```bash
npm run dev
```
เปิดเบราเซอร์ไปที่ http://localhost:3000

#### Production Build
```bash
npm run build
npm start
```

## 🔧 การตั้งค่า LINE LIFF

### 1. สร้าง LINE Login Channel
1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. สร้าง Provider (ถ้ายังไม่มี)
3. สร้าง LINE Login Channel
4. บันทึก Channel ID และ Channel Secret

### 2. สร้าง LIFF App
1. ใน LINE Login Channel ของคุณ
2. ไปที่แท็บ "LIFF"
3. กด "Add" เพื่อสร้าง LIFF App ใหม่
4. ตั้งค่า:
   - **LIFF app name**: CNX Work Permit
   - **Size**: Full
   - **Endpoint URL**: `https://your-domain.com` (สำหรับ production)
   - **Scope**: profile, openid
   - **Bot link feature**: Optional
5. บันทึก LIFF ID

### 3. ตั้งค่า Channel Access Token
1. ไปที่แท็บ "Messaging API"
2. สร้าง Channel Access Token (long-lived)
3. คัดลอก Token

### 4. อัพเดท Environment Variables
นำค่าที่ได้มาใส่ในไฟล์ `.env.local`:
- `NEXT_PUBLIC_LINE_CHANNEL_ID`
- `LINE_CHANNEL_SECRET`
- `NEXT_PUBLIC_LINE_LIFF_ID`
- `LINE_CHANNEL_ACCESS_TOKEN`

## 📱 ขั้นตอนการใช้งาน

### ผู้ใช้ทั่วไป:
1. **เข้าสู่ระบบ** - Login ด้วย LINE
2. **ลงทะเบียน** - กรอกข้อมูลบริษัท, เบอร์โทร, อีเมล
3. **สร้างคำขอ** - กรอกรายละเอียดงาน, พื้นที่, ช่วงเวลา
4. **ดูรายการ** - ตรวจสอบสถานะคำขอของตนเอง

### ผู้ดูแลระบบ:
1. รับ Notification ผ่าน LINE เมื่อมีคำขอใหม่
2. ตรวจสอบและอนุมัติผ่านฐานข้อมูล (ใช้ stored procedure)

## 🗄️ Database Schema

### ตารางหลัก:
- **Users** - ข้อมูลผู้ใช้
- **Areas** - พื้นที่ปฏิบัติงาน
- **WorkTypes** - ประเภทงาน
- **Equipment** - อุปกรณ์
- **WorkPermits** - คำขอเข้าปฏิบัติงาน
- **WorkPermitDocuments** - เอกสารแนบ
- **AuditLog** - Log การเปลี่ยนแปลง
- **LineNotifications** - Log การส่ง LINE

### Stored Procedures สำคัญ:
- `usp_RegisterUser` - ลงทะเบียนผู้ใช้
- `usp_CreateWorkPermit` - สร้างคำขอ
- `usp_UpdatePermitStatus` - อัพเดทสถานะ
- `usp_GetUserWorkPermits` - ดูรายการคำขอของผู้ใช้

## 🚀 Deployment Options

### Option 1: Vercel (แนะนำ)
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Set Environment Variables ใน Vercel Dashboard
# 4. Update LIFF Endpoint URL
```

### Option 2: Azure Static Web Apps
1. สร้าง Azure Static Web App
2. เชื่อมต่อกับ GitHub Repository
3. ตั้งค่า Build settings:
   - Build command: `npm run build`
   - Output directory: `.next`
4. เพิ่ม Environment Variables
5. Update LIFF Endpoint URL

### Option 3: Self-hosted Server
```bash
# 1. Build for production
npm run build

# 2. Start with PM2
npm install -g pm2
pm2 start npm --name "cnx-workpermit" -- start

# 3. Setup Nginx Reverse Proxy
# 4. Setup SSL Certificate
```

## 🔒 Security Checklist

- [ ] ตรวจสอบว่า `.env.local` ไม่ถูก commit ไปยัง Git
- [ ] ใช้ HTTPS ใน Production
- [ ] ตรวจสอบ API Key และ LINE Tokens ถูกต้อง
- [ ] ตั้งค่า CORS ที่ API Server
- [ ] Enable SQL Server Firewall Rules
- [ ] ใช้ Stored Procedures เพื่อป้องกัน SQL Injection
- [ ] ตรวจสอบสิทธิ์การเข้าถึง Database

## 📊 Monitoring

### Application Logs
```bash
# Development
npm run dev

# Production (with PM2)
pm2 logs cnx-workpermit
```

### Database Monitoring
```sql
-- ตรวจสอบ Audit Log
SELECT TOP 100 * FROM AuditLog 
ORDER BY ChangedDate DESC

-- ตรวจสอบ LINE Notifications
SELECT * FROM LineNotifications 
WHERE SentDate >= DATEADD(day, -7, GETDATE())
ORDER BY SentDate DESC
```

## 🆘 Troubleshooting

### LIFF ไม่ทำงาน
- ตรวจสอบ LIFF ID ถูกต้อง
- ตรวจสอบ Endpoint URL ตรงกับ deployed URL
- ต้องใช้ HTTPS ใน Production
- ลองเปิดใน LINE App Browser

### API Connection Error
- ตรวจสอบ API Key
- ตรวจสอบ Database Name
- ตรวจสอบ Network/Firewall
- ดู Console Logs

### LINE Notification ไม่ส่ง
- ตรวจสอบ Channel Access Token
- ตรวจสอบ Admin LINE ID ถูกต้อง
- ดู LineNotifications table

## 📞 Support

สำหรับปัญหาหรือคำถาม กรุณาติดต่อทีมพัฒนา

---
**Version**: 1.0.0  
**Last Updated**: 2026-01-21
