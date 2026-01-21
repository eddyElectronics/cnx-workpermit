-- =====================================================
-- ตรวจสอบการตั้งค่าระบบเอกสาร (WorkPermitDocuments)
-- =====================================================
USE CNXWorkPermit
GO

PRINT '========================================='
PRINT 'เช็คสถานะระบบ WorkPermitDocuments'
PRINT '========================================='
PRINT ''

-- 1. ตรวจสอบว่า table WorkPermitDocuments มีอยู่หรือไม่
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'WorkPermitDocuments')
BEGIN
    PRINT '✓ Table WorkPermitDocuments มีอยู่แล้ว'
    
    -- แสดงจำนวนข้อมูล
    DECLARE @RecordCount INT
    SELECT @RecordCount = COUNT(*) FROM [dbo].[WorkPermitDocuments]
    PRINT '  จำนวนเอกสาร: ' + CAST(@RecordCount AS NVARCHAR(10)) + ' รายการ'
    PRINT ''
END
ELSE
BEGIN
    PRINT '✗ Table WorkPermitDocuments ไม่มี!'
    PRINT '  → ต้องรัน script สร้าง table ก่อน'
    PRINT ''
END

-- 2. ตรวจสอบว่า stored procedure usp_AddPermitDocument มีอยู่หรือไม่
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'usp_AddPermitDocument')
BEGIN
    PRINT '✓ Stored Procedure usp_AddPermitDocument มีอยู่แล้ว'
    PRINT ''
END
ELSE
BEGIN
    PRINT '✗ Stored Procedure usp_AddPermitDocument ไม่มี!'
    PRINT '  → ต้องรัน script สร้าง stored procedure'
    PRINT ''
END

-- 3. แสดงข้อมูลเอกสารล่าสุด (ถ้ามี)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'WorkPermitDocuments')
BEGIN
    DECLARE @DocumentCount INT
    SELECT @DocumentCount = COUNT(*) FROM [dbo].[WorkPermitDocuments]
    
    IF @DocumentCount > 0
    BEGIN
        PRINT '========================================='
        PRINT 'เอกสาร 5 รายการล่าสุด:'
        PRINT '========================================='
        
        SELECT TOP 5
            [DocumentId],
            [PermitId],
            [DocumentName],
            [DocumentPath],
            [DocumentType],
            [FileSize],
            [UploadedDate]
        FROM [dbo].[WorkPermitDocuments]
        ORDER BY [UploadedDate] DESC
    END
    ELSE
    BEGIN
        PRINT '========================================='
        PRINT 'ไม่มีเอกสารในระบบ'
        PRINT '========================================='
    END
END

PRINT ''
PRINT '========================================='
PRINT 'เสร็จสิ้น'
PRINT '========================================='
