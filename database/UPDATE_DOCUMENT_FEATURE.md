# อัปเดตฟีเจอร์บันทึกเอกสารประกอบ (Work Permit Documents)

## สิ่งที่อัปเดต

### 1. Database (SQL Server)
✅ **เพิ่ม Stored Procedure**: `usp_AddPermitDocument`
- รับพารามิเตอร์: PermitId, DocumentName, DocumentPath, DocumentType, FileSize
- บันทึกข้อมูลเอกสารลงตาราง `WorkPermitDocuments`

### 2. API Layer (`lib/api.ts`)
✅ **เพิ่ม Function**:
- `addPermitDocument()` - บันทึกเอกสาร
- `getPermitDocuments()` - ดึงรายการเอกสารตาม PermitId

### 3. Upload API (`app/api/upload/route.ts`)
✅ **อัปเดต**: 
- บันทึกไฟล์ลงโฟลเดอร์ `public/uploads/{permitId}/`
- เรียก stored procedure เพื่อบันทึกข้อมูลลง database
- รองรับการอัพโหลดหลายไฟล์พร้อมกัน

### 4. Frontend (`app/permit/create/page.tsx`)
✅ **มีอยู่แล้ว**:
- Input file รองรับ `multiple` attribute
- แสดงรายการไฟล์ที่เลือก
- Validation: สูงสุด 10MB ต่อไฟล์
- รองรับไฟล์: JPG, PNG, PDF
- สามารถลบไฟล์ออกก่อนส่ง

## วิธีใช้งาน

### สำหรับ Admin: อัปเดต Database
1. เปิดไฟล์ `database/deploy_all_in_one.sql`
2. หาบรรทัดที่ 739-779 (Stored Procedure: usp_AddPermitDocument)
3. รัน SQL Script เฉพาะส่วน Stored Procedure:

```sql
-- ===============================================
-- 9. Add Permit Document
-- ===============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'usp_AddPermitDocument')
    DROP PROCEDURE [dbo].[usp_AddPermitDocument]
GO

CREATE PROCEDURE [dbo].[usp_AddPermitDocument]
    @PermitId INT,
    @DocumentName NVARCHAR(255),
    @DocumentPath NVARCHAR(500),
    @DocumentType NVARCHAR(50),
    @FileSize BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        INSERT INTO [dbo].[WorkPermitDocuments] 
        (
            [PermitId], 
            [DocumentName], 
            [DocumentPath], 
            [DocumentType], 
            [FileSize]
        )
        VALUES 
        (
            @PermitId, 
            @DocumentName, 
            @DocumentPath, 
            @DocumentType, 
            @FileSize
        );
        
        SELECT 
            SCOPE_IDENTITY() AS [DocumentId],
            @PermitId AS [PermitId];
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO
```

### สำหรับ User: ใช้งานระบบ
1. เข้าหน้า "สร้างคำขอเข้าปฏิบัติงาน"
2. กรอกข้อมูลฟอร์มตามปกติ
3. คลิก "เลือกไฟล์" ในส่วน "อัพโหลดเอกสารประกอบ"
4. **เลือกได้หลายไฟล์พร้อมกัน** (กด Ctrl หรือ Shift ค้างไว้)
5. ตรวจสอบรายการไฟล์ที่เลือก (สามารถลบออกได้)
6. คลิก "บันทึกคำขอ"
7. ระบบจะ:
   - สร้างคำขอใหม่
   - อัพโหลดไฟล์ไปยัง server
   - **บันทึกข้อมูลไฟล์ลง database**
   - ส่งการแจ้งเตือนให้ Admin

## ข้อมูลที่บันทึก

ตาราง `WorkPermitDocuments`:
- `DocumentId` (Auto increment)
- `PermitId` (Foreign Key → WorkPermits)
- `DocumentName` (ชื่อไฟล์ต้นฉบับ)
- `DocumentPath` (Path ในระบบ: /uploads/{permitId}/{timestamp}_{filename})
- `DocumentType` (MIME type: image/jpeg, image/png, application/pdf)
- `FileSize` (ขนาดไฟล์ในหน่วย bytes)
- `UploadedDate` (วันที่อัพโหลด - Auto)

## การตรวจสอบ

ดูเอกสารที่บันทึก:
```sql
SELECT * FROM [dbo].[WorkPermitDocuments] 
WHERE [PermitId] = <PermitId>
ORDER BY [UploadedDate] DESC
```

## Features ที่ต้องพัฒนาต่อ (Optional)

- [ ] หน้าแสดงรูปภาพในหน้า Admin Approval
- [ ] ดาวน์โหลดเอกสาร
- [ ] Preview รูปภาพและ PDF
- [ ] ลบเอกสาร (Soft delete)
- [ ] จำกัดจำนวนไฟล์ต่อคำขอ

---

**หมายเหตุ**: ไฟล์จะถูกเก็บที่ `public/uploads/{PermitId}/` และสามารถเข้าถึงได้ผ่าน URL: `https://localhost:3000/uploads/{PermitId}/{filename}`
