# CNX Work Permit System - Project Summary

## 🎯 ภาพรวมโครงการ

ระบบคำขอเข้าปฏิบัติงาน สำหรับท่าอากาศยานเชียงใหม่ (Chiang Mai International Airport)  
เป็น SPA Web Application ที่ใช้ LINE Login และเชื่อมต่อกับ SQL Server Database ผ่าน REST API

---

## 📁 โครงสร้างโปรเจกต์

```
cnx-workpermit/
├── app/                                    # Next.js App Router
│   ├── api/                               # API Routes
│   │   └── line/notify/route.ts          # LINE Push Notification
│   ├── permit/
│   │   ├── create/page.tsx               # สร้างคำขอ Work Permit
│   │   └── list/page.tsx                 # รายการคำขอของผู้ใช้
│   ├── register/page.tsx                  # หน้าลงทะเบียนผู้ใช้
│   ├── layout.tsx                         # Root Layout
│   ├── page.tsx                           # หน้าแรก (LINE Login)
│   └── globals.css                        # Global Styles
│
├── lib/                                    # Shared Libraries
│   ├── api.ts                             # Database API Service
│   ├── config.ts                          # Configuration
│   ├── liff.ts                            # LINE LIFF Service
│   └── store.ts                           # Zustand State Management
│
├── database/                               # SQL Server Scripts
│   ├── deploy_all_in_one.sql             # ⭐ All-in-One Deployment
│   ├── 01_create_tables.sql              # Table Definitions
│   ├── 02_create_views.sql               # Views
│   ├── 03_create_stored_procedures.sql   # Stored Procedures
│   ├── 04_insert_sample_data.sql         # Sample Data
│   └── README.md                          # Database Documentation
│
├── public/                                 # Static Assets
├── .env.local                             # Environment Variables (ห้าม commit!)
├── package.json                           # Dependencies
├── tsconfig.json                          # TypeScript Config
├── tailwind.config.js                     # Tailwind Config
├── next.config.js                         # Next.js Config
├── README.md                              # Project README
└── SETUP.md                               # Setup Guide
```

---

## 🔧 เทคโนโลยีที่ใช้

### Frontend
- **Framework**: Next.js 16.1.4 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19.2.3
- **Styling**: Tailwind CSS 4
- **State**: Zustand 4.5.0
- **Forms**: React Hook Form 7.53.0 + Zod 3.23.0
- **LINE**: @line/liff 2.24.0
- **HTTP Client**: Axios 1.7.0
- **Date**: date-fns 4.1.0

### Backend
- **Database**: SQL Server (CNXWorkPermit)
- **API**: REST API Proxy (airportthai.co.th)
- **Authentication**: LINE LIFF

---

## 📊 Database Schema

### Tables (8 ตาราง)

1. **Users** - ข้อมูลผู้ใช้
   - UserId (PK)
   - LineUserId (UNIQUE)
   - CompanyName, Department, FullName
   - PhoneNumber, Email
   - IsAdmin, IsActive

2. **Areas** - พื้นที่ปฏิบัติงาน
   - AreaId (PK)
   - AreaCode, AreaName, Description
   - IsActive

3. **WorkTypes** - ประเภทงาน
   - WorkTypeId (PK)
   - WorkTypeCode, WorkTypeName, Description
   - IsActive

4. **Equipment** - อุปกรณ์
   - EquipmentId (PK)
   - EquipmentCode, EquipmentName, Description
   - IsActive

5. **WorkPermits** - คำขอเข้าปฏิบัติงาน ⭐
   - PermitId (PK)
   - PermitNumber (AUTO: WP-YYYYMMDD-XXXX)
   - UserId (FK), OwnerName, CompanyName
   - AreaId (FK), WorkTypeId (FK)
   - WorkShift (08:00-17:00, 17:00-00:00, 00:00-08:00)
   - StartDate, EndDate
   - Status (รอตรวจสอบ, อนุมัติ, ไม่อนุมัติ, ยกเลิก)
   - Remarks

6. **WorkPermitDocuments** - เอกสารแนบ
   - DocumentId (PK)
   - PermitId (FK)
   - DocumentType, FilePath, FileName

7. **AuditLog** - บันทึกการเปลี่ยนแปลง
   - LogId (PK)
   - TableName, RecordId, Action
   - ChangedBy, ChangedDate

8. **LineNotifications** - บันทึกการส่ง LINE
   - NotificationId (PK)
   - PermitId (FK), RecipientLineId
   - Message, Status

### Views (6 views)
- vw_ActiveUsers
- vw_ActiveAreas
- vw_ActiveWorkTypes
- vw_ActiveEquipment
- vw_WorkPermits ⭐
- vw_WorkPermitDocuments

### Stored Procedures (9 procedures)
- usp_RegisterUser ⭐
- usp_CreateWorkPermit ⭐
- usp_UpdatePermitStatus
- usp_DeleteWorkPermit
- usp_GetUserWorkPermits
- usp_GetPermitById
- usp_AddPermitDocument
- usp_GetPermitDocuments
- usp_LogNotification

---

## 🚀 ฟีเจอร์หลัก

### 1. Authentication (LINE Login)
- ✅ LINE LIFF Integration
- ✅ Auto-redirect after login
- ✅ Profile sync (Name, Picture)
- ✅ Persistent session (Zustand + localStorage)

### 2. User Registration
- ✅ LINE Profile pre-fill
- ✅ Company & Department info
- ✅ Phone & Email validation
- ✅ Auto-save to database

### 3. Work Permit Creation
- ✅ Dynamic form with validation
- ✅ Area selection (from database)
- ✅ Work type selection (from database)
- ✅ Work shift options (3 shifts)
- ✅ Date range picker
- ✅ Remarks (optional)
- ✅ Auto-generate Permit Number

### 4. Work Permit List
- ✅ User's permits only
- ✅ Status badges (color-coded)
- ✅ Sort by date (newest first)
- ✅ Detail view (expandable cards)

### 5. LINE Notification
- ✅ Push message to admin
- ✅ Auto-trigger on new permit
- ✅ Include permit details
- ✅ Log notification history

---

## 🔐 Environment Variables

```env
# Database API
NEXT_PUBLIC_API_BASE_URL=https://api.airportthai.co.th/proxy/api
NEXT_PUBLIC_API_KEY=LmBuBI2P4IrjEMLHWRrcrgh1TAQ4AwCpoNHQKLIh
NEXT_PUBLIC_DATABASE_NAME=CNXWorkPermit

# LINE Configuration
NEXT_PUBLIC_LINE_CHANNEL_ID=1654076318
LINE_CHANNEL_SECRET=<secret>
NEXT_PUBLIC_LINE_LIFF_ID=1654076318-08gnXfNt
LINE_CHANNEL_ACCESS_TOKEN=<token>

# Admin LINE ID
NEXT_PUBLIC_ADMIN_LINE_ID=Cbf8c6d2e6287a5d59c5e9262e0321d2a
```

---

## 📝 API Integration

### Database Query
```typescript
import { queryDatabase } from '@/lib/api'

const users = await queryDatabase<User[]>(
  'SELECT * FROM Users WHERE LineUserId = @LineUserId',
  { LineUserId: 'U1234567890' }
)
```

### Stored Procedure
```typescript
import { executeProcedure } from '@/lib/api'

await executeProcedure('usp_CreateWorkPermit', {
  UserId: 1,
  OwnerName: 'John Doe',
  CompanyName: 'ABC Corp',
  AreaId: 1,
  WorkTypeId: 2,
  WorkShift: '08:00-17:00',
  StartDate: '2026-01-25',
  EndDate: '2026-01-26',
  Remarks: null
})
```

### API Service Functions
```typescript
import { apiService } from '@/lib/api'

// Register User
await apiService.registerUser({ ... })

// Get Areas
const areas = await apiService.getAreas()

// Get Work Types
const workTypes = await apiService.getWorkTypes()

// Create Work Permit
await apiService.createWorkPermit({ ... })

// Get User's Permits
const permits = await apiService.getUserWorkPermits(userId)

// Get User by LINE ID
const users = await apiService.getUserByLineId(lineUserId)
```

---

## 🎨 UI Components (Tailwind CSS)

### Custom Classes
```css
.card                    /* White card with shadow */
.btn-primary            /* Primary button (blue) */
.btn-secondary          /* Secondary button (outlined) */
.input                  /* Form input field */
.label                  /* Form label */
.error-text             /* Validation error text */
```

### Color Scheme
- **Primary**: Blue (#1976D2 - #0D47A1)
- **Success**: Green
- **Warning**: Yellow
- **Error**: Red
- **Neutral**: Gray

---

## 📱 User Flow

```
1. Landing Page (/)
   ↓ Click "เข้าสู่ระบบด้วย LINE"
   
2. LINE Login (LIFF)
   ↓ Get Profile (userId, displayName, pictureUrl)
   
3. Check Registration
   ├─ ถ้าลงทะเบียนแล้ว → /permit/list
   └─ ถ้ายังไม่ได้ลงทะเบียน → /register
   
4. Register Page (/register)
   ↓ Fill Company, Phone, Email
   ↓ Submit → Save to DB
   
5. Create Permit (/permit/create)
   ↓ Fill Permit Details
   ↓ Submit → Save to DB → Send LINE to Admin
   
6. Permit List (/permit/list)
   └─ View all permits with status
```

---

## 🚀 การติดตั้งและรัน

### 1. Install Dependencies
```bash
cd e:\SourceControl\cnx-workpermit
npm install
```

### 2. Setup Environment
สร้างไฟล์ `.env.local` (ดูตัวอย่างด้านบน)

### 3. Deploy Database
```sql
-- ใช้ SSMS รัน: database/deploy_all_in_one.sql
USE CNXWorkPermit;
GO
```

### 4. Run Development Server
```bash
npm run dev
```
เปิด: http://localhost:3000

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 📦 ขั้นตอนการ Deploy (Production)

### Option 1: Vercel (แนะนำ)
1. Push code ไป GitHub
2. Connect Vercel to GitHub
3. เพิ่ม Environment Variables
4. อัพเดท LIFF Endpoint URL

### Option 2: Azure Static Web Apps
1. สร้าง Azure Static Web App
2. เชื่อมต่อ GitHub Repository
3. ตั้งค่า Build: `npm run build`
4. เพิ่ม Environment Variables

### Option 3: Self-hosted
```bash
npm run build
pm2 start npm --name "cnx-workpermit" -- start
```

---

## ✅ Checklist การ Deploy

- [ ] Database deployed และมีข้อมูล Sample
- [ ] Environment variables ครบถ้วน
- [ ] LINE LIFF App สร้างแล้ว
- [ ] LIFF Endpoint URL อัพเดทแล้ว
- [ ] Channel Access Token ถูกต้อง
- [ ] Admin LINE ID ถูกต้อง
- [ ] API Key ใช้งานได้
- [ ] HTTPS enabled (Production only)
- [ ] CORS configured
- [ ] Firewall rules set

---

## 🐛 Known Issues & Solutions

### Issue: LIFF ไม่ทำงาน
**Solution**: 
- ต้องเปิดใน LINE App Browser
- ต้องใช้ HTTPS ใน Production
- ตรวจสอบ LIFF ID และ Endpoint URL

### Issue: API Connection Failed
**Solution**:
- ตรวจสอบ API Key ถูกต้อง
- ตรวจสอบ Network/Firewall
- ตรวจสอบ Database Name

### Issue: LINE Notification ไม่ส่ง
**Solution**:
- ตรวจสอบ Channel Access Token
- ตรวจสอบ Admin LINE ID
- ดู Console Logs และ LineNotifications table

---

## 📚 เอกสารเพิ่มเติม

- [README.md](README.md) - คู่มือการใช้งาน
- [SETUP.md](SETUP.md) - คู่มือติดตั้งโดยละเอียด
- [database/README.md](database/README.md) - เอกสาร Database Schema

---

## 📞 การสนับสนุน

สำหรับปัญหาหรือคำถาม กรุณาติดต่อทีมพัฒนา

---

**Project**: CNX Work Permit System  
**Version**: 1.0.0  
**Created**: 2026-01-21  
**Author**: Development Team  
**License**: Proprietary - Chiang Mai International Airport
