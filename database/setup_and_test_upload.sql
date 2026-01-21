-- =====================================================
-- ติดตั้ง usp_AddPermitDocument และทดสอบ
-- =====================================================
USE CNXWorkPermit
GO

PRINT '========================================='
PRINT 'ขั้นตอนที่ 1: ตรวจสอบ Table'
PRINT '========================================='

-- ตรวจสอบ Table WorkPermitDocuments
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'WorkPermitDocuments')
BEGIN
    PRINT '✓ Table WorkPermitDocuments มีอยู่แล้ว'
    
    -- แสดงโครงสร้าง
    PRINT ''
    PRINT 'โครงสร้าง Table:'
    SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'WorkPermitDocuments'
    ORDER BY ORDINAL_POSITION
END
ELSE
BEGIN
    PRINT '✗ Table WorkPermitDocuments ไม่มี - ต้องสร้างก่อน!'
END

PRINT ''
PRINT '========================================='
PRINT 'ขั้นตอนที่ 2: สร้าง Stored Procedure'
PRINT '========================================='

-- ลบ stored procedure เก่า (ถ้ามี)
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'usp_AddPermitDocument')
BEGIN
    DROP PROCEDURE [dbo].[usp_AddPermitDocument]
    PRINT '- ลบ stored procedure เก่าแล้ว'
END
GO

-- สร้าง stored procedure ใหม่
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
        
        DECLARE @NewDocumentId INT = SCOPE_IDENTITY()
        
        -- Return result
        SELECT 
            @NewDocumentId AS [DocumentId],
            @PermitId AS [PermitId],
            'Success' AS [Status];
            
    END TRY
    BEGIN CATCH
        SELECT 
            ERROR_NUMBER() AS [ErrorNumber],
            ERROR_MESSAGE() AS [ErrorMessage],
            ERROR_LINE() AS [ErrorLine],
            'Failed' AS [Status];
        THROW;
    END CATCH
END
GO

PRINT '✓ สร้าง usp_AddPermitDocument สำเร็จ'
PRINT ''

PRINT '========================================='
PRINT 'ขั้นตอนที่ 3: เตรียม Test Data'
PRINT '========================================='

-- หา PermitId ที่มีอยู่จริง
DECLARE @ExistingPermitId INT
SELECT TOP 1 @ExistingPermitId = PermitId 
FROM [dbo].[WorkPermits]
ORDER BY PermitId DESC

IF @ExistingPermitId IS NOT NULL
BEGIN
    PRINT '✓ พบ PermitId ที่มีอยู่: ' + CAST(@ExistingPermitId AS NVARCHAR(10))
    PRINT '  จะใช้ PermitId นี้สำหรับทดสอบ'
END
ELSE
BEGIN
    PRINT '⚠️  ไม่พบ WorkPermit ในระบบ'
    PRINT '  กำลังสร้าง WorkPermit ตัวอย่างเพื่อทดสอบ...'
    
    -- สร้าง WorkPermit ตัวอย่าง
    INSERT INTO [dbo].[WorkPermits] 
    (
        [UserId], 
        [PermitNumber],
        [OwnerName], 
        [CompanyName], 
        [AreaId], 
        [WorkTypeId],
        [WorkShift],
        [StartDate],
        [EndDate],
        [Status],
        [Remarks]
    )
    VALUES 
    (
        1,  -- UserId (ต้องมีอยู่ใน Users table)
        'TEST-999',
        'Test Owner',
        'Test Company',
        1,  -- AreaId (ต้องมีอยู่ใน Areas table)
        1,  -- WorkTypeId (ต้องมีอยู่ใน WorkTypes table)
        '08:00-17:00',
        GETDATE(),
        DATEADD(day, 1, GETDATE()),
        N'รอตรวจสอบ',
        'Test WorkPermit for document upload testing'
    )
    
    SET @ExistingPermitId = SCOPE_IDENTITY()
    PRINT '✓ สร้าง WorkPermit สำเร็จ: PermitId = ' + CAST(@ExistingPermitId AS NVARCHAR(10))
END

PRINT ''
PRINT '========================================='
PRINT 'ขั้นตอนที่ 4: ทดสอบ Stored Procedure'
PRINT '========================================='

-- ทดสอบเพิ่มเอกสาร
PRINT 'กำลังทดสอบเพิ่มเอกสาร...'
PRINT ''

DECLARE @TestPermitId INT = @ExistingPermitId
DECLARE @TestDocumentName NVARCHAR(255) = 'test_document.jpg'
DECLARE @TestDocumentPath NVARCHAR(500) = '/uploads/' + CAST(@TestPermitId AS NVARCHAR(10)) + '/test_document.jpg'
DECLARE @TestDocumentType NVARCHAR(50) = 'image/jpeg'
DECLARE @TestFileSize BIGINT = 524288

BEGIN TRY
    EXEC [dbo].[usp_AddPermitDocument]
        @PermitId = @TestPermitId,
        @DocumentName = @TestDocumentName,
        @DocumentPath = @TestDocumentPath,
        @DocumentType = @TestDocumentType,
        @FileSize = @TestFileSize
    
    PRINT '✓ ทดสอบสำเร็จ!'
    PRINT ''
    
    -- แสดงเอกสารที่เพิ่งเพิ่ม
    PRINT 'เอกสารที่เพิ่งเพิ่ม:'
    SELECT TOP 1 * FROM [dbo].[WorkPermitDocuments] 
    ORDER BY [DocumentId] DESC
    
END TRY
BEGIN CATCH
    PRINT '✗ เกิดข้อผิดพลาด!'
    PRINT 'Error: ' + ERROR_MESSAGE()
END CATCH

PRINT ''
PRINT '========================================='
PRINT 'ขั้นตอนที่ 5: แสดงเอกสารทั้งหมด'
PRINT '========================================='

SELECT COUNT(*) AS [TotalDocuments] FROM [dbo].[WorkPermitDocuments]
PRINT ''

IF EXISTS (SELECT * FROM [dbo].[WorkPermitDocuments])
BEGIN
    SELECT 
        [DocumentId],
        [PermitId],
        [DocumentName],
        [DocumentType],
        [FileSize],
        [UploadedDate]
    FROM [dbo].[WorkPermitDocuments]
    ORDER BY [UploadedDate] DESC
END
ELSE
BEGIN
    PRINT 'ไม่มีเอกสารในระบบ'
END

PRINT ''
PRINT '========================================='
PRINT '✅ เสร็จสิ้น!'
PRINT '========================================='
PRINT ''
PRINT 'หมายเหตุ:'
PRINT '1. ถ้า stored procedure ทำงาน → ไปทดสอบอัพโหลดจากเว็บ'
PRINT '2. เปิดไฟล์: https://localhost:3000/test-upload.html'
PRINT '3. ระบุ Permit ID = ' + CAST(@ExistingPermitId AS NVARCHAR(10)) + ' (หรือใช้ PermitId ที่มีอยู่จริง)'
PRINT '4. เลือกไฟล์และกด Upload Files'
PRINT '5. กด Check Database เพื่อตรวจสอบผล'
GO
