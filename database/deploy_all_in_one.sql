-- ===============================================
-- Work Permit System - Complete Deployment Script
-- Chiangmai Airport
-- ===============================================
-- This script includes ALL components in a single file
-- for easy deployment in SQL Server Management Studio
-- ===============================================

USE [CNXWorkPermit]
GO

PRINT '================================================'
PRINT 'Starting Work Permit System Database Deployment'
PRINT '================================================'
PRINT ''

-- ===============================================
-- STEP 1: CREATE TABLES
-- ===============================================
PRINT 'Step 1: Creating tables...'
GO

-- ===============================================
-- 1. Users Table (ผู้ใช้งานระบบ)
-- ===============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE [dbo].[Users] (
        [UserId] INT IDENTITY(1,1) PRIMARY KEY,
        [LineUserId] NVARCHAR(100) UNIQUE NOT NULL,
        [CompanyName] NVARCHAR(200) NOT NULL,
        [Department] NVARCHAR(200) NULL,
        [FullName] NVARCHAR(200) NOT NULL,
        [PhoneNumber] NVARCHAR(20) NOT NULL,
        [Email] NVARCHAR(100) NULL,
        [IsAdmin] BIT DEFAULT 0,
        [IsActive] BIT DEFAULT 1,
        [CreatedDate] DATETIME DEFAULT GETDATE(),
        [UpdatedDate] DATETIME DEFAULT GETDATE(),
        [LastLoginDate] DATETIME NULL
    )
    
    CREATE INDEX IX_Users_LineUserId ON [dbo].[Users]([LineUserId])
    CREATE INDEX IX_Users_IsActive ON [dbo].[Users]([IsActive])
    
    PRINT '✓ Users table created'
END
ELSE
    PRINT '- Users table already exists'
GO

-- ===============================================
-- 2. Areas Table (พื้นที่)
-- ===============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Areas')
BEGIN
    CREATE TABLE [dbo].[Areas] (
        [AreaId] INT IDENTITY(1,1) PRIMARY KEY,
        [AreaCode] NVARCHAR(50) NOT NULL,
        [AreaName] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(500) NULL,
        [IsActive] BIT DEFAULT 1,
        [IsDeleted] BIT DEFAULT 0,
        [CreatedBy] INT NULL,
        [CreatedDate] DATETIME DEFAULT GETDATE(),
        [UpdatedBy] INT NULL,
        [UpdatedDate] DATETIME DEFAULT GETDATE(),
        [DeletedBy] INT NULL,
        [DeletedDate] DATETIME NULL,
        CONSTRAINT FK_Areas_CreatedBy FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users]([UserId]),
        CONSTRAINT FK_Areas_UpdatedBy FOREIGN KEY ([UpdatedBy]) REFERENCES [dbo].[Users]([UserId]),
        CONSTRAINT FK_Areas_DeletedBy FOREIGN KEY ([DeletedBy]) REFERENCES [dbo].[Users]([UserId])
    )
    
    CREATE UNIQUE INDEX IX_Areas_AreaCode ON [dbo].[Areas]([AreaCode]) WHERE [IsDeleted] = 0
    CREATE INDEX IX_Areas_IsActive ON [dbo].[Areas]([IsActive], [IsDeleted])
    
    PRINT '✓ Areas table created'
END
ELSE
    PRINT '- Areas table already exists'
GO

-- ===============================================
-- 3. WorkTypes Table (ประเภทงาน)
-- ===============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'WorkTypes')
BEGIN
    CREATE TABLE [dbo].[WorkTypes] (
        [WorkTypeId] INT IDENTITY(1,1) PRIMARY KEY,
        [WorkTypeCode] NVARCHAR(50) NOT NULL,
        [WorkTypeName] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(500) NULL,
        [IsActive] BIT DEFAULT 1,
        [IsDeleted] BIT DEFAULT 0,
        [CreatedBy] INT NULL,
        [CreatedDate] DATETIME DEFAULT GETDATE(),
        [UpdatedBy] INT NULL,
        [UpdatedDate] DATETIME DEFAULT GETDATE(),
        [DeletedBy] INT NULL,
        [DeletedDate] DATETIME NULL,
        CONSTRAINT FK_WorkTypes_CreatedBy FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users]([UserId]),
        CONSTRAINT FK_WorkTypes_UpdatedBy FOREIGN KEY ([UpdatedBy]) REFERENCES [dbo].[Users]([UserId]),
        CONSTRAINT FK_WorkTypes_DeletedBy FOREIGN KEY ([DeletedBy]) REFERENCES [dbo].[Users]([UserId])
    )
    
    CREATE UNIQUE INDEX IX_WorkTypes_WorkTypeCode ON [dbo].[WorkTypes]([WorkTypeCode]) WHERE [IsDeleted] = 0
    CREATE INDEX IX_WorkTypes_IsActive ON [dbo].[WorkTypes]([IsActive], [IsDeleted])
    
    PRINT '✓ WorkTypes table created'
END
ELSE
    PRINT '- WorkTypes table already exists'
GO

-- ===============================================
-- 4. Equipment Table (อุปกรณ์)
-- ===============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Equipment')
BEGIN
    CREATE TABLE [dbo].[Equipment] (
        [EquipmentId] INT IDENTITY(1,1) PRIMARY KEY,
        [EquipmentCode] NVARCHAR(50) NOT NULL,
        [EquipmentName] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(500) NULL,
        [IsActive] BIT DEFAULT 1,
        [IsDeleted] BIT DEFAULT 0,
        [CreatedBy] INT NULL,
        [CreatedDate] DATETIME DEFAULT GETDATE(),
        [UpdatedBy] INT NULL,
        [UpdatedDate] DATETIME DEFAULT GETDATE(),
        [DeletedBy] INT NULL,
        [DeletedDate] DATETIME NULL,
        CONSTRAINT FK_Equipment_CreatedBy FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users]([UserId]),
        CONSTRAINT FK_Equipment_UpdatedBy FOREIGN KEY ([UpdatedBy]) REFERENCES [dbo].[Users]([UserId]),
        CONSTRAINT FK_Equipment_DeletedBy FOREIGN KEY ([DeletedBy]) REFERENCES [dbo].[Users]([UserId])
    )
    
    CREATE UNIQUE INDEX IX_Equipment_EquipmentCode ON [dbo].[Equipment]([EquipmentCode]) WHERE [IsDeleted] = 0
    CREATE INDEX IX_Equipment_IsActive ON [dbo].[Equipment]([IsActive], [IsDeleted])
    
    PRINT '✓ Equipment table created'
END
ELSE
    PRINT '- Equipment table already exists'
GO

-- ===============================================
-- 5. WorkPermits Table (คำขอเข้าปฏิบัติงาน)
-- ===============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'WorkPermits')
BEGIN
    CREATE TABLE [dbo].[WorkPermits] (
        [PermitId] INT IDENTITY(1,1) PRIMARY KEY,
        [PermitNumber] NVARCHAR(50) UNIQUE NOT NULL,
        [UserId] INT NOT NULL,
        [OwnerName] NVARCHAR(200) NOT NULL,
        [CompanyName] NVARCHAR(200) NOT NULL,
        [AreaId] INT NOT NULL,
        [WorkTypeId] INT NOT NULL,
        [WorkShift] NVARCHAR(50) NOT NULL,
        [StartDate] DATE NOT NULL,
        [EndDate] DATE NOT NULL,
        [Status] NVARCHAR(50) DEFAULT N'รอตรวจสอบ',
        [Remarks] NVARCHAR(1000) NULL,
        [CreatedDate] DATETIME DEFAULT GETDATE(),
        [UpdatedDate] DATETIME DEFAULT GETDATE(),
        [ReviewedBy] INT NULL,
        [ReviewedDate] DATETIME NULL,
        [ReviewComments] NVARCHAR(1000) NULL,
        CONSTRAINT FK_WorkPermits_UserId FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([UserId]),
        CONSTRAINT FK_WorkPermits_AreaId FOREIGN KEY ([AreaId]) REFERENCES [dbo].[Areas]([AreaId]),
        CONSTRAINT FK_WorkPermits_WorkTypeId FOREIGN KEY ([WorkTypeId]) REFERENCES [dbo].[WorkTypes]([WorkTypeId]),
        CONSTRAINT FK_WorkPermits_ReviewedBy FOREIGN KEY ([ReviewedBy]) REFERENCES [dbo].[Users]([UserId])
    )
    
    CREATE INDEX IX_WorkPermits_UserId ON [dbo].[WorkPermits]([UserId])
    CREATE INDEX IX_WorkPermits_Status ON [dbo].[WorkPermits]([Status])
    CREATE INDEX IX_WorkPermits_StartDate ON [dbo].[WorkPermits]([StartDate], [EndDate])
    CREATE INDEX IX_WorkPermits_CreatedDate ON [dbo].[WorkPermits]([CreatedDate])
    
    PRINT '✓ WorkPermits table created'
END
ELSE
    PRINT '- WorkPermits table already exists'
GO

-- ===============================================
-- 6. WorkPermitDocuments Table (เอกสารประกอบ)
-- ===============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'WorkPermitDocuments')
BEGIN
    CREATE TABLE [dbo].[WorkPermitDocuments] (
        [DocumentId] INT IDENTITY(1,1) PRIMARY KEY,
        [PermitId] INT NOT NULL,
        [DocumentName] NVARCHAR(255) NOT NULL,
        [DocumentPath] NVARCHAR(500) NOT NULL,
        [DocumentType] NVARCHAR(50) NULL,
        [FileSize] BIGINT NULL,
        [UploadedDate] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_WorkPermitDocuments_PermitId FOREIGN KEY ([PermitId]) REFERENCES [dbo].[WorkPermits]([PermitId]) ON DELETE CASCADE
    )
    
    CREATE INDEX IX_WorkPermitDocuments_PermitId ON [dbo].[WorkPermitDocuments]([PermitId])
    
    PRINT '✓ WorkPermitDocuments table created'
END
ELSE
    PRINT '- WorkPermitDocuments table already exists'
GO

-- ===============================================
-- 7. AuditLog Table (บันทึกการเปลี่ยนแปลง)
-- ===============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLog')
BEGIN
    CREATE TABLE [dbo].[AuditLog] (
        [LogId] INT IDENTITY(1,1) PRIMARY KEY,
        [TableName] NVARCHAR(100) NOT NULL,
        [RecordId] INT NOT NULL,
        [Action] NVARCHAR(50) NOT NULL,
        [OldValue] NVARCHAR(MAX) NULL,
        [NewValue] NVARCHAR(MAX) NULL,
        [ChangedBy] INT NULL,
        [ChangedDate] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_AuditLog_ChangedBy FOREIGN KEY ([ChangedBy]) REFERENCES [dbo].[Users]([UserId])
    )
    
    CREATE INDEX IX_AuditLog_TableName ON [dbo].[AuditLog]([TableName], [RecordId])
    CREATE INDEX IX_AuditLog_ChangedDate ON [dbo].[AuditLog]([ChangedDate])
    
    PRINT '✓ AuditLog table created'
END
ELSE
    PRINT '- AuditLog table already exists'
GO

-- ===============================================
-- 8. LineNotifications Table (บันทึกการส่งแจ้งเตือน)
-- ===============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LineNotifications')
BEGIN
    CREATE TABLE [dbo].[LineNotifications] (
        [NotificationId] INT IDENTITY(1,1) PRIMARY KEY,
        [PermitId] INT NULL,
        [RecipientLineId] NVARCHAR(100) NOT NULL,
        [MessageType] NVARCHAR(50) NOT NULL,
        [MessageContent] NVARCHAR(MAX) NOT NULL,
        [IsSent] BIT DEFAULT 0,
        [SentDate] DATETIME NULL,
        [ErrorMessage] NVARCHAR(500) NULL,
        [CreatedDate] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_LineNotifications_PermitId FOREIGN KEY ([PermitId]) REFERENCES [dbo].[WorkPermits]([PermitId])
    )
    
    CREATE INDEX IX_LineNotifications_PermitId ON [dbo].[LineNotifications]([PermitId])
    CREATE INDEX IX_LineNotifications_IsSent ON [dbo].[LineNotifications]([IsSent])
    
    PRINT '✓ LineNotifications table created'
END
ELSE
    PRINT '- LineNotifications table already exists'
GO

PRINT 'Step 1 completed: All tables created successfully!'
PRINT ''
GO

-- ===============================================
-- STEP 2: CREATE VIEWS
-- ===============================================
PRINT 'Step 2: Creating views...'
GO

-- ===============================================
-- View: vw_WorkPermits
-- ===============================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_WorkPermits')
    DROP VIEW [dbo].[vw_WorkPermits]
GO

CREATE VIEW [dbo].[vw_WorkPermits]
AS
SELECT 
    wp.[PermitId], wp.[PermitNumber], wp.[UserId],
    u.[FullName] AS [UserFullName], u.[CompanyName] AS [UserCompany],
    u.[PhoneNumber] AS [UserPhone], u.[LineUserId],
    wp.[OwnerName], wp.[CompanyName],
    wp.[AreaId], a.[AreaCode], a.[AreaName],
    wp.[WorkTypeId], wt.[WorkTypeCode], wt.[WorkTypeName],
    wp.[WorkShift], wp.[StartDate], wp.[EndDate], wp.[Status], wp.[Remarks],
    wp.[CreatedDate], wp.[UpdatedDate], wp.[ReviewedBy],
    reviewer.[FullName] AS [ReviewerName], wp.[ReviewedDate], wp.[ReviewComments],
    DATEDIFF(DAY, wp.[StartDate], wp.[EndDate]) + 1 AS [WorkDays],
    (SELECT COUNT(*) FROM [dbo].[WorkPermitDocuments] wpd WHERE wpd.[PermitId] = wp.[PermitId]) AS [DocumentCount]
FROM [dbo].[WorkPermits] wp
    INNER JOIN [dbo].[Users] u ON wp.[UserId] = u.[UserId]
    INNER JOIN [dbo].[Areas] a ON wp.[AreaId] = a.[AreaId]
    INNER JOIN [dbo].[WorkTypes] wt ON wp.[WorkTypeId] = wt.[WorkTypeId]
    LEFT JOIN [dbo].[Users] reviewer ON wp.[ReviewedBy] = reviewer.[UserId]
GO
PRINT '✓ vw_WorkPermits created'
GO

-- ===============================================
-- View: vw_PendingWorkPermits
-- ===============================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_PendingWorkPermits')
    DROP VIEW [dbo].[vw_PendingWorkPermits]
GO

CREATE VIEW [dbo].[vw_PendingWorkPermits]
AS
SELECT * FROM [dbo].[vw_WorkPermits] WHERE [Status] = N'รอตรวจสอบ'
GO
PRINT '✓ vw_PendingWorkPermits created'
GO

-- ===============================================
-- View: vw_ActiveAreas
-- ===============================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_ActiveAreas')
    DROP VIEW [dbo].[vw_ActiveAreas]
GO

CREATE VIEW [dbo].[vw_ActiveAreas]
AS
SELECT 
    a.[AreaId], a.[AreaCode], a.[AreaName], a.[Description],
    a.[CreatedDate], a.[UpdatedDate],
    creator.[FullName] AS [CreatedByName], updater.[FullName] AS [UpdatedByName]
FROM [dbo].[Areas] a
    LEFT JOIN [dbo].[Users] creator ON a.[CreatedBy] = creator.[UserId]
    LEFT JOIN [dbo].[Users] updater ON a.[UpdatedBy] = updater.[UserId]
WHERE a.[IsActive] = 1 AND a.[IsDeleted] = 0
GO
PRINT '✓ vw_ActiveAreas created'
GO

-- ===============================================
-- View: vw_ActiveWorkTypes
-- ===============================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_ActiveWorkTypes')
    DROP VIEW [dbo].[vw_ActiveWorkTypes]
GO

CREATE VIEW [dbo].[vw_ActiveWorkTypes]
AS
SELECT 
    wt.[WorkTypeId], wt.[WorkTypeCode], wt.[WorkTypeName], wt.[Description],
    wt.[CreatedDate], wt.[UpdatedDate],
    creator.[FullName] AS [CreatedByName], updater.[FullName] AS [UpdatedByName]
FROM [dbo].[WorkTypes] wt
    LEFT JOIN [dbo].[Users] creator ON wt.[CreatedBy] = creator.[UserId]
    LEFT JOIN [dbo].[Users] updater ON wt.[UpdatedBy] = updater.[UserId]
WHERE wt.[IsActive] = 1 AND wt.[IsDeleted] = 0
GO
PRINT '✓ vw_ActiveWorkTypes created'
GO

-- ===============================================
-- View: vw_ActiveEquipment
-- ===============================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_ActiveEquipment')
    DROP VIEW [dbo].[vw_ActiveEquipment]
GO

CREATE VIEW [dbo].[vw_ActiveEquipment]
AS
SELECT 
    e.[EquipmentId], e.[EquipmentCode], e.[EquipmentName], e.[Description],
    e.[CreatedDate], e.[UpdatedDate],
    creator.[FullName] AS [CreatedByName], updater.[FullName] AS [UpdatedByName]
FROM [dbo].[Equipment] e
    LEFT JOIN [dbo].[Users] creator ON e.[CreatedBy] = creator.[UserId]
    LEFT JOIN [dbo].[Users] updater ON e.[UpdatedBy] = updater.[UserId]
WHERE e.[IsActive] = 1 AND e.[IsDeleted] = 0
GO
PRINT '✓ vw_ActiveEquipment created'
GO

-- ===============================================
-- View: vw_WorkPermitStatistics
-- ===============================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_WorkPermitStatistics')
    DROP VIEW [dbo].[vw_WorkPermitStatistics]
GO

CREATE VIEW [dbo].[vw_WorkPermitStatistics]
AS
SELECT 
    CAST([CreatedDate] AS DATE) AS [Date], COUNT(*) AS [TotalPermits],
    SUM(CASE WHEN [Status] = N'รอตรวจสอบ' THEN 1 ELSE 0 END) AS [PendingCount],
    SUM(CASE WHEN [Status] = N'อนุมัติ' THEN 1 ELSE 0 END) AS [ApprovedCount],
    SUM(CASE WHEN [Status] = N'ไม่อนุมัติ' THEN 1 ELSE 0 END) AS [RejectedCount],
    SUM(CASE WHEN [Status] = N'ยกเลิก' THEN 1 ELSE 0 END) AS [CancelledCount]
FROM [dbo].[WorkPermits]
GROUP BY CAST([CreatedDate] AS DATE)
GO
PRINT '✓ vw_WorkPermitStatistics created'
GO

PRINT 'Step 2 completed: All views created successfully!'
PRINT ''
GO

-- ===============================================
-- STEP 3: CREATE STORED PROCEDURES
-- ===============================================
PRINT 'Step 3: Creating stored procedures...'
GO

-- ===============================================
-- SP: usp_RegisterUser
-- ===============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'usp_RegisterUser')
    DROP PROCEDURE [dbo].[usp_RegisterUser]
GO

CREATE PROCEDURE [dbo].[usp_RegisterUser]
    @LineUserId NVARCHAR(100), @CompanyName NVARCHAR(200),
    @Department NVARCHAR(200) = NULL, @FullName NVARCHAR(200),
    @PhoneNumber NVARCHAR(20), @Email NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @UserId INT;
    SELECT @UserId = [UserId] FROM [dbo].[Users] WHERE [LineUserId] = @LineUserId;
    
    IF @UserId IS NULL
    BEGIN
        INSERT INTO [dbo].[Users] ([LineUserId], [CompanyName], [Department], [FullName], [PhoneNumber], [Email], [LastLoginDate])
        VALUES (@LineUserId, @CompanyName, @Department, @FullName, @PhoneNumber, @Email, GETDATE());
        SET @UserId = SCOPE_IDENTITY();
        SELECT @UserId AS [UserId], 'CREATED' AS [Status];
    END
    ELSE
    BEGIN
        UPDATE [dbo].[Users]
        SET [CompanyName] = @CompanyName, [Department] = @Department, [FullName] = @FullName,
            [PhoneNumber] = @PhoneNumber, [Email] = @Email, [LastLoginDate] = GETDATE(), [UpdatedDate] = GETDATE()
        WHERE [UserId] = @UserId;
        SELECT @UserId AS [UserId], 'UPDATED' AS [Status];
    END
END
GO
PRINT '✓ usp_RegisterUser created'
GO

-- ===============================================
-- SP: usp_CreateWorkPermit
-- ===============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'usp_CreateWorkPermit')
    DROP PROCEDURE [dbo].[usp_CreateWorkPermit]
GO

CREATE PROCEDURE [dbo].[usp_CreateWorkPermit]
    @UserId INT, @OwnerName NVARCHAR(200), @CompanyName NVARCHAR(200),
    @AreaId INT, @WorkTypeId INT, @WorkShift NVARCHAR(50),
    @StartDate DATE, @EndDate DATE, @Remarks NVARCHAR(1000) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @PermitId INT, @PermitNumber NVARCHAR(50);
    DECLARE @Year NVARCHAR(4) = CAST(YEAR(GETDATE()) AS NVARCHAR(4));
    DECLARE @Month NVARCHAR(2) = RIGHT('0' + CAST(MONTH(GETDATE()) AS NVARCHAR(2)), 2);
    DECLARE @Day NVARCHAR(2) = RIGHT('0' + CAST(DAY(GETDATE()) AS NVARCHAR(2)), 2);
    DECLARE @Sequence NVARCHAR(2);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        -- Count permits created today
        SELECT @Sequence = RIGHT('00' + CAST(COUNT(*) + 1 AS NVARCHAR(2)), 2)
        FROM [dbo].[WorkPermits]
        WHERE CAST([CreatedDate] AS DATE) = CAST(GETDATE() AS DATE);
        
        -- Format: CNX-P{YYYYMMDD}-{Running number 2 digit}
        SET @PermitNumber = 'CNX-P' + @Year + @Month + @Day + '-' + @Sequence;
        
        INSERT INTO [dbo].[WorkPermits] ([PermitNumber], [UserId], [OwnerName], [CompanyName],
            [AreaId], [WorkTypeId], [WorkShift], [StartDate], [EndDate], [Status], [Remarks])
        VALUES (@PermitNumber, @UserId, @OwnerName, @CompanyName,
            @AreaId, @WorkTypeId, @WorkShift, @StartDate, @EndDate, N'รอตรวจสอบ', @Remarks);
        
        SET @PermitId = SCOPE_IDENTITY();
        
        INSERT INTO [dbo].[AuditLog] ([TableName], [RecordId], [Action], [NewValue], [ChangedBy])
        VALUES ('WorkPermits', @PermitId, 'INSERT', 'PermitNumber: ' + @PermitNumber + ', Status: รอตรวจสอบ', @UserId);
        
        COMMIT TRANSACTION;
        SELECT @PermitId AS [PermitId], @PermitNumber AS [PermitNumber], 'SUCCESS' AS [Status];
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END
GO
PRINT '✓ usp_CreateWorkPermit created'
GO

-- ===============================================
-- SP: usp_UpdateWorkPermitStatus
-- ===============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'usp_UpdateWorkPermitStatus')
    DROP PROCEDURE [dbo].[usp_UpdateWorkPermitStatus]
GO

CREATE PROCEDURE [dbo].[usp_UpdateWorkPermitStatus]
    @PermitId INT, @Status NVARCHAR(50), @ReviewedBy INT, @ReviewComments NVARCHAR(1000) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @OldStatus NVARCHAR(50);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        SELECT @OldStatus = [Status] FROM [dbo].[WorkPermits] WHERE [PermitId] = @PermitId;
        
        UPDATE [dbo].[WorkPermits]
        SET [Status] = @Status, [ReviewedBy] = @ReviewedBy, [ReviewedDate] = GETDATE(),
            [ReviewComments] = @ReviewComments, [UpdatedDate] = GETDATE()
        WHERE [PermitId] = @PermitId;
        
        INSERT INTO [dbo].[AuditLog] ([TableName], [RecordId], [Action], [OldValue], [NewValue], [ChangedBy])
        VALUES ('WorkPermits', @PermitId, 'UPDATE', 'Status: ' + ISNULL(@OldStatus, 'NULL'), 'Status: ' + @Status, @ReviewedBy);
        
        COMMIT TRANSACTION;
        SELECT 'SUCCESS' AS [Status];
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END
GO
PRINT '✓ usp_UpdateWorkPermitStatus created'
GO

-- ===============================================
-- SP: usp_ManageArea (CRUD)
-- ===============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'usp_ManageArea')
    DROP PROCEDURE [dbo].[usp_ManageArea]
GO

CREATE PROCEDURE [dbo].[usp_ManageArea]
    @Action NVARCHAR(10), @AreaId INT = NULL, @AreaCode NVARCHAR(50) = NULL,
    @AreaName NVARCHAR(200) = NULL, @Description NVARCHAR(500) = NULL,
    @IsActive BIT = 1, @UserId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @Action = 'CREATE'
    BEGIN
        IF EXISTS (SELECT 1 FROM [dbo].[Areas] WHERE [AreaCode] = @AreaCode AND [IsDeleted] = 0)
        BEGIN
            RAISERROR('รหัสพื้นที่นี้มีอยู่แล้ว', 16, 1);
            RETURN;
        END
        INSERT INTO [dbo].[Areas] ([AreaCode], [AreaName], [Description], [IsActive], [CreatedBy])
        VALUES (@AreaCode, @AreaName, @Description, @IsActive, @UserId);
        SELECT SCOPE_IDENTITY() AS [AreaId], 'SUCCESS' AS [Status];
    END
    ELSE IF @Action = 'UPDATE'
    BEGIN
        IF EXISTS (SELECT 1 FROM [dbo].[Areas] WHERE [AreaCode] = @AreaCode AND [AreaId] != @AreaId AND [IsDeleted] = 0)
        BEGIN
            RAISERROR('รหัสพื้นที่นี้มีอยู่แล้ว', 16, 1);
            RETURN;
        END
        UPDATE [dbo].[Areas]
        SET [AreaCode] = @AreaCode, [AreaName] = @AreaName, [Description] = @Description,
            [IsActive] = @IsActive, [UpdatedBy] = @UserId, [UpdatedDate] = GETDATE()
        WHERE [AreaId] = @AreaId;
        SELECT 'SUCCESS' AS [Status];
    END
    ELSE IF @Action = 'DELETE'
    BEGIN
        UPDATE [dbo].[Areas]
        SET [IsDeleted] = 1, [DeletedBy] = @UserId, [DeletedDate] = GETDATE()
        WHERE [AreaId] = @AreaId;
        SELECT 'SUCCESS' AS [Status];
    END
    ELSE IF @Action = 'GET'
        SELECT * FROM [dbo].[vw_ActiveAreas] WHERE [AreaId] = @AreaId;
    ELSE IF @Action = 'LIST'
        SELECT * FROM [dbo].[vw_ActiveAreas] ORDER BY [AreaName];
END
GO
PRINT '✓ usp_ManageArea created'
GO

-- ===============================================
-- SP: usp_ManageWorkType (CRUD)
-- ===============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'usp_ManageWorkType')
    DROP PROCEDURE [dbo].[usp_ManageWorkType]
GO

CREATE PROCEDURE [dbo].[usp_ManageWorkType]
    @Action NVARCHAR(10), @WorkTypeId INT = NULL, @WorkTypeCode NVARCHAR(50) = NULL,
    @WorkTypeName NVARCHAR(200) = NULL, @Description NVARCHAR(500) = NULL,
    @IsActive BIT = 1, @UserId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @Action = 'CREATE'
    BEGIN
        IF EXISTS (SELECT 1 FROM [dbo].[WorkTypes] WHERE [WorkTypeCode] = @WorkTypeCode AND [IsDeleted] = 0)
        BEGIN
            RAISERROR('รหัสประเภทงานนี้มีอยู่แล้ว', 16, 1);
            RETURN;
        END
        INSERT INTO [dbo].[WorkTypes] ([WorkTypeCode], [WorkTypeName], [Description], [IsActive], [CreatedBy])
        VALUES (@WorkTypeCode, @WorkTypeName, @Description, @IsActive, @UserId);
        SELECT SCOPE_IDENTITY() AS [WorkTypeId], 'SUCCESS' AS [Status];
    END
    ELSE IF @Action = 'UPDATE'
    BEGIN
        IF EXISTS (SELECT 1 FROM [dbo].[WorkTypes] WHERE [WorkTypeCode] = @WorkTypeCode AND [WorkTypeId] != @WorkTypeId AND [IsDeleted] = 0)
        BEGIN
            RAISERROR('รหัสประเภทงานนี้มีอยู่แล้ว', 16, 1);
            RETURN;
        END
        UPDATE [dbo].[WorkTypes]
        SET [WorkTypeCode] = @WorkTypeCode, [WorkTypeName] = @WorkTypeName, [Description] = @Description,
            [IsActive] = @IsActive, [UpdatedBy] = @UserId, [UpdatedDate] = GETDATE()
        WHERE [WorkTypeId] = @WorkTypeId;
        SELECT 'SUCCESS' AS [Status];
    END
    ELSE IF @Action = 'DELETE'
    BEGIN
        UPDATE [dbo].[WorkTypes]
        SET [IsDeleted] = 1, [DeletedBy] = @UserId, [DeletedDate] = GETDATE()
        WHERE [WorkTypeId] = @WorkTypeId;
        SELECT 'SUCCESS' AS [Status];
    END
    ELSE IF @Action = 'GET'
        SELECT * FROM [dbo].[vw_ActiveWorkTypes] WHERE [WorkTypeId] = @WorkTypeId;
    ELSE IF @Action = 'LIST'
        SELECT * FROM [dbo].[vw_ActiveWorkTypes] ORDER BY [WorkTypeName];
END
GO
PRINT '✓ usp_ManageWorkType created'
GO

-- ===============================================
-- SP: usp_ManageEquipment (CRUD)
-- ===============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'usp_ManageEquipment')
    DROP PROCEDURE [dbo].[usp_ManageEquipment]
GO

CREATE PROCEDURE [dbo].[usp_ManageEquipment]
    @Action NVARCHAR(10), @EquipmentId INT = NULL, @EquipmentCode NVARCHAR(50) = NULL,
    @EquipmentName NVARCHAR(200) = NULL, @Description NVARCHAR(500) = NULL,
    @IsActive BIT = 1, @UserId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @Action = 'CREATE'
    BEGIN
        IF EXISTS (SELECT 1 FROM [dbo].[Equipment] WHERE [EquipmentCode] = @EquipmentCode AND [IsDeleted] = 0)
        BEGIN
            RAISERROR('รหัสอุปกรณ์นี้มีอยู่แล้ว', 16, 1);
            RETURN;
        END
        INSERT INTO [dbo].[Equipment] ([EquipmentCode], [EquipmentName], [Description], [IsActive], [CreatedBy])
        VALUES (@EquipmentCode, @EquipmentName, @Description, @IsActive, @UserId);
        SELECT SCOPE_IDENTITY() AS [EquipmentId], 'SUCCESS' AS [Status];
    END
    ELSE IF @Action = 'UPDATE'
    BEGIN
        IF EXISTS (SELECT 1 FROM [dbo].[Equipment] WHERE [EquipmentCode] = @EquipmentCode AND [EquipmentId] != @EquipmentId AND [IsDeleted] = 0)
        BEGIN
            RAISERROR('รหัสอุปกรณ์นี้มีอยู่แล้ว', 16, 1);
            RETURN;
        END
        UPDATE [dbo].[Equipment]
        SET [EquipmentCode] = @EquipmentCode, [EquipmentName] = @EquipmentName, [Description] = @Description,
            [IsActive] = @IsActive, [UpdatedBy] = @UserId, [UpdatedDate] = GETDATE()
        WHERE [EquipmentId] = @EquipmentId;
        SELECT 'SUCCESS' AS [Status];
    END
    ELSE IF @Action = 'DELETE'
    BEGIN
        UPDATE [dbo].[Equipment]
        SET [IsDeleted] = 1, [DeletedBy] = @UserId, [DeletedDate] = GETDATE()
        WHERE [EquipmentId] = @EquipmentId;
        SELECT 'SUCCESS' AS [Status];
    END
    ELSE IF @Action = 'GET'
        SELECT * FROM [dbo].[vw_ActiveEquipment] WHERE [EquipmentId] = @EquipmentId;
    ELSE IF @Action = 'LIST'
        SELECT * FROM [dbo].[vw_ActiveEquipment] ORDER BY [EquipmentName];
END
GO
PRINT '✓ usp_ManageEquipment created'
GO

-- ===============================================
-- SP: usp_GetWorkPermitsByUser
-- ===============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'usp_GetWorkPermitsByUser')
    DROP PROCEDURE [dbo].[usp_GetWorkPermitsByUser]
GO

CREATE PROCEDURE [dbo].[usp_GetWorkPermitsByUser]
    @UserId INT, @Status NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM [dbo].[vw_WorkPermits]
    WHERE [UserId] = @UserId AND (@Status IS NULL OR [Status] = @Status)
    ORDER BY [CreatedDate] DESC;
END
GO
PRINT '✓ usp_GetWorkPermitsByUser created'
GO

-- ===============================================
-- SP: usp_GetPendingWorkPermits
-- ===============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'usp_GetPendingWorkPermits')
    DROP PROCEDURE [dbo].[usp_GetPendingWorkPermits]
GO

CREATE PROCEDURE [dbo].[usp_GetPendingWorkPermits]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM [dbo].[vw_PendingWorkPermits] ORDER BY [CreatedDate] ASC;
END
GO
PRINT '✓ usp_GetPendingWorkPermits created'
GO

-- ===============================================
-- SP: usp_SaveLineNotification
-- ===============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'usp_SaveLineNotification')
    DROP PROCEDURE [dbo].[usp_SaveLineNotification]
GO

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
PRINT '✓ usp_AddPermitDocument created'
GO

-- ===============================================
-- 10. Save LINE Notification
-- ===============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'usp_SaveLineNotification')
    DROP PROCEDURE [dbo].[usp_SaveLineNotification]
GO

CREATE PROCEDURE [dbo].[usp_SaveLineNotification]
    @PermitId INT = NULL, @RecipientLineId NVARCHAR(100), @MessageType NVARCHAR(50),
    @MessageContent NVARCHAR(MAX), @IsSent BIT = 0, @ErrorMessage NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO [dbo].[LineNotifications] ([PermitId], [RecipientLineId], [MessageType], [MessageContent], [IsSent], [SentDate], [ErrorMessage])
    VALUES (@PermitId, @RecipientLineId, @MessageType, @MessageContent, @IsSent, CASE WHEN @IsSent = 1 THEN GETDATE() ELSE NULL END, @ErrorMessage);
    SELECT SCOPE_IDENTITY() AS [NotificationId];
END
GO
PRINT '✓ usp_SaveLineNotification created'
GO

PRINT 'Step 3 completed: All stored procedures created successfully!'
PRINT ''
GO

-- ===============================================
-- STEP 4: INSERT SAMPLE DATA
-- ===============================================
PRINT 'Step 4: Inserting sample data...'
GO

-- Admin User
IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE [LineUserId] = 'Cbf8c6d2e6287a5d59c5e9262e0321d2a')
BEGIN
    INSERT INTO [dbo].[Users] ([LineUserId], [CompanyName], [Department], [FullName], [PhoneNumber], [Email], [IsAdmin], [IsActive])
    VALUES ('Cbf8c6d2e6287a5d59c5e9262e0321d2a', N'ท่าอากาศยานเชียงใหม่', N'ฝ่ายดูแลระบบ', N'ผู้ดูแลระบบ', '0812345678', 'admin@cnxairport.com', 1, 1);
    PRINT '✓ Admin user created';
END
ELSE
    PRINT '- Admin user already exists';
GO

-- Sample Areas
DECLARE @AdminId INT;
SELECT @AdminId = [UserId] FROM [dbo].[Users] WHERE [IsAdmin] = 1;

IF NOT EXISTS (SELECT 1 FROM [dbo].[Areas] WHERE [AreaCode] = 'AREA-001')
BEGIN
    INSERT INTO [dbo].[Areas] ([AreaCode], [AreaName], [Description], [CreatedBy])
    VALUES 
        ('AREA-001', N'อาคารผู้โดยสารภายใน', N'บริเวณอาคารผู้โดยสารภายใน ชั้น 1-3', @AdminId),
        ('AREA-002', N'อาคารผู้โดยสารระหว่างประเทศ', N'บริเวณอาคารผู้โดยสารระหว่างประเทศ', @AdminId),
        ('AREA-003', N'ลานจอดอากาศยาน', N'Apron และพื้นที่ลานจอดอากาศยาน', @AdminId),
        ('AREA-004', N'ทางวิ่ง (Runway)', N'ทางวิ่งและพื้นที่โดยรอบ', @AdminId),
        ('AREA-005', N'อาคารสำนักงาน', N'อาคารสำนักงานฝ่ายต่างๆ', @AdminId),
        ('AREA-006', N'โรงจอดรถ', N'ที่จอดรถอาคารผู้โดยสาร', @AdminId),
        ('AREA-007', N'โกดังสินค้า', N'โกดังเก็บสินค้าและอุปกรณ์', @AdminId),
        ('AREA-008', N'ระบบไฟฟ้า', N'ห้องไฟฟ้าและระบบไฟฟ้า', @AdminId),
        ('AREA-009', N'ระบบประปา', N'ห้องปั๊มน้ำและระบบประปา', @AdminId),
        ('AREA-010', N'ระบบปรับอากาศ', N'ห้องเครื่องปรับอากาศและ Chiller', @AdminId);
    PRINT '✓ Sample areas inserted (10 records)';
END
ELSE
    PRINT '- Sample areas already exist';
GO

-- Sample Work Types
DECLARE @AdminId INT;
SELECT @AdminId = [UserId] FROM [dbo].[Users] WHERE [IsAdmin] = 1;

IF NOT EXISTS (SELECT 1 FROM [dbo].[WorkTypes] WHERE [WorkTypeCode] = 'WT-001')
BEGIN
    INSERT INTO [dbo].[WorkTypes] ([WorkTypeCode], [WorkTypeName], [Description], [CreatedBy])
    VALUES 
        ('WT-001', N'งานก่อสร้าง', N'งานก่อสร้างอาคาร โครงสร้าง', @AdminId),
        ('WT-002', N'งานซ่อมบำรุง', N'งานซ่อมแซมบำรุงรักษา', @AdminId),
        ('WT-003', N'งานไฟฟ้า', N'งานติดตั้งและซ่อมแซมระบบไฟฟ้า', @AdminId),
        ('WT-004', N'งานประปา', N'งานติดตั้งและซ่อมแซมระบบประปา', @AdminId),
        ('WT-005', N'งานปรับอากาศ', N'งานติดตั้งและซ่อมแซมระบบปรับอากาศ', @AdminId),
        ('WT-006', N'งานทาสี', N'งานทาสีอาคารและโครงสร้าง', @AdminId),
        ('WT-007', N'งานทำความสะอาด', N'งานทำความสะอาดพื้นที่ต่างๆ', @AdminId),
        ('WT-008', N'งานภูมิทัศน์', N'งานจัดสวนและดูแลต้นไม้', @AdminId),
        ('WT-009', N'งานตรวจสอบ', N'งานตรวจสอบความปลอดภัย', @AdminId),
        ('WT-010', N'งานติดตั้งอุปกรณ์', N'งานติดตั้งอุปกรณ์ต่างๆ', @AdminId);
    PRINT '✓ Sample work types inserted (10 records)';
END
ELSE
    PRINT '- Sample work types already exist';
GO

-- Sample Equipment
DECLARE @AdminId INT;
SELECT @AdminId = [UserId] FROM [dbo].[Users] WHERE [IsAdmin] = 1;

IF NOT EXISTS (SELECT 1 FROM [dbo].[Equipment] WHERE [EquipmentCode] = 'EQ-001')
BEGIN
    INSERT INTO [dbo].[Equipment] ([EquipmentCode], [EquipmentName], [Description], [CreatedBy])
    VALUES 
        ('EQ-001', N'บันไดเลื่อน', N'บันไดเลื่อนสำหรับงานที่สูง', @AdminId),
        ('EQ-002', N'นั่งร้าน', N'นั่งร้านสำหรับงานสูง', @AdminId),
        ('EQ-003', N'เครื่องมือช่าง', N'เครื่องมือช่างทั่วไป', @AdminId),
        ('EQ-004', N'เครื่องเชื่อม', N'เครื่องเชื่อมไฟฟ้า', @AdminId),
        ('EQ-005', N'เครื่องตัด', N'เครื่องตัดโลหะ', @AdminId),
        ('EQ-006', N'เครื่องเจาะ', N'เครื่องเจาะไฟฟ้า', @AdminId),
        ('EQ-007', N'เครื่องวัด', N'เครื่องมือวัดต่างๆ', @AdminId),
        ('EQ-008', N'รถเข็น', N'รถเข็นอุปกรณ์', @AdminId),
        ('EQ-009', N'อุปกรณ์ความปลอดภัย', N'หมวก เสื้อสะท้อนแสง รองเท้านิรภัย', @AdminId),
        ('EQ-010', N'เครื่องทำความสะอาด', N'เครื่องดูดฝุ่น เครื่องขัดพื้น', @AdminId);
    PRINT '✓ Sample equipment inserted (10 records)';
END
ELSE
    PRINT '- Sample equipment already exist';
GO

PRINT 'Step 4 completed: Sample data inserted successfully!'
PRINT ''
GO

-- ===============================================
-- DEPLOYMENT SUMMARY
-- ===============================================
PRINT '================================================'
PRINT 'Deployment Summary'
PRINT '================================================'
PRINT ''

SELECT 'Tables' AS [ObjectType], COUNT(*) AS [Count]
FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo')
UNION ALL
SELECT 'Views', COUNT(*) FROM sys.views WHERE schema_id = SCHEMA_ID('dbo')
UNION ALL
SELECT 'Stored Procedures', COUNT(*) FROM sys.procedures WHERE schema_id = SCHEMA_ID('dbo')
ORDER BY [ObjectType]
GO

PRINT ''
PRINT 'Critical Objects Verification:'
PRINT '------------------------------'

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
    PRINT '✓ Users table exists'
ELSE
    PRINT '✗ Users table NOT found!'

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'WorkPermits')
    PRINT '✓ WorkPermits table exists'
ELSE
    PRINT '✗ WorkPermits table NOT found!'

IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_WorkPermits')
    PRINT '✓ vw_WorkPermits view exists'
ELSE
    PRINT '✗ vw_WorkPermits view NOT found!'

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'usp_RegisterUser')
    PRINT '✓ usp_RegisterUser procedure exists'
ELSE
    PRINT '✗ usp_RegisterUser procedure NOT found!'

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'usp_CreateWorkPermit')
    PRINT '✓ usp_CreateWorkPermit procedure exists'
ELSE
    PRINT '✗ usp_CreateWorkPermit procedure NOT found!'

PRINT ''
PRINT '================================================'
PRINT 'DATABASE IS READY FOR USE!'
PRINT '================================================'
PRINT ''
GO
