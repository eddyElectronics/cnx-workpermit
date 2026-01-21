-- =====================================================
-- ทดสอบ stored procedure usp_AddPermitDocument
-- =====================================================
USE CNXWorkPermit
GO

PRINT '========================================='
PRINT 'ทดสอบ usp_AddPermitDocument'
PRINT '========================================='
PRINT ''

-- ทดสอบเพิ่มเอกสาร
DECLARE @TestPermitId INT = 1
DECLARE @TestDocumentName NVARCHAR(255) = 'test_document.jpg'
DECLARE @TestDocumentPath NVARCHAR(500) = '/uploads/1/test_document.jpg'
DECLARE @TestDocumentType NVARCHAR(50) = 'image/jpeg'
DECLARE @TestFileSize BIGINT = 524288

PRINT 'กำลังทดสอบเพิ่มเอกสาร...'
PRINT 'PermitId: ' + CAST(@TestPermitId AS NVARCHAR(10))
PRINT 'DocumentName: ' + @TestDocumentName
PRINT ''

BEGIN TRY
    EXEC [dbo].[usp_AddPermitDocument]
        @PermitId = @TestPermitId,
        @DocumentName = @TestDocumentName,
        @DocumentPath = @TestDocumentPath,
        @DocumentType = @TestDocumentType,
        @FileSize = @TestFileSize
    
    PRINT '✓ เพิ่มเอกสารสำเร็จ!'
    PRINT ''
    
    -- แสดงเอกสารที่เพิ่งเพิ่ม
    PRINT 'เอกสารที่เพิ่งเพิ่ม:'
    SELECT TOP 1 * FROM [dbo].[WorkPermitDocuments] 
    ORDER BY [DocumentId] DESC
    
END TRY
BEGIN CATCH
    PRINT '✗ เกิดข้อผิดพลาด!'
    PRINT 'Error Message: ' + ERROR_MESSAGE()
    PRINT 'Error Number: ' + CAST(ERROR_NUMBER() AS NVARCHAR(10))
    PRINT 'Error Line: ' + CAST(ERROR_LINE() AS NVARCHAR(10))
END CATCH

PRINT ''
PRINT '========================================='
PRINT 'เสร็จสิ้น'
PRINT '========================================='
