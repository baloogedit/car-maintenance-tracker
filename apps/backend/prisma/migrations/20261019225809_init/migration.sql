BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Company] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [taxId] NVARCHAR(1000),
    [is_deleted] BIT NOT NULL CONSTRAINT [Company_is_deleted_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Company_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [Company_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Company_taxId_key] UNIQUE NONCLUSTERED ([taxId])
);

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [passwordHash] NVARCHAR(1000) NOT NULL,
    [firstName] NVARCHAR(1000) NOT NULL,
    [lastName] NVARCHAR(1000),
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'PRIVATE',
    [companyId] NVARCHAR(1000),
    [is_deleted] BIT NOT NULL CONSTRAINT [User_is_deleted_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [User_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[RefreshToken] (
    [id] NVARCHAR(1000) NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [revoked] BIT NOT NULL CONSTRAINT [RefreshToken_revoked_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [RefreshToken_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [RefreshToken_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [RefreshToken_token_key] UNIQUE NONCLUSTERED ([token])
);

-- CreateTable
CREATE TABLE [dbo].[Vehicle] (
    [id] NVARCHAR(1000) NOT NULL,
    [ownerUserId] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000),
    [make] NVARCHAR(1000) NOT NULL,
    [model] NVARCHAR(1000) NOT NULL,
    [year] INT NOT NULL,
    [vin] NVARCHAR(1000),
    [licensePlate] NVARCHAR(1000),
    [engineType] NVARCHAR(1000),
    [fuelType] NVARCHAR(1000) NOT NULL CONSTRAINT [Vehicle_fuelType_df] DEFAULT 'GASOLINE',
    [currentMileage] INT NOT NULL CONSTRAINT [Vehicle_currentMileage_df] DEFAULT 0,
    [purchaseDate] DATETIME2,
    [is_deleted] BIT NOT NULL CONSTRAINT [Vehicle_is_deleted_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Vehicle_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [Vehicle_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Vehicle_vin_key] UNIQUE NONCLUSTERED ([vin])
);

-- CreateTable
CREATE TABLE [dbo].[MaintenanceLog] (
    [id] NVARCHAR(1000) NOT NULL,
    [vehicleId] NVARCHAR(1000) NOT NULL,
    [serviceDate] DATETIME2 NOT NULL,
    [mileageAtService] INT NOT NULL,
    [totalCost] DECIMAL(10,2),
    [notes] NVARCHAR(1000),
    [synced] BIT NOT NULL CONSTRAINT [MaintenanceLog_synced_df] DEFAULT 1,
    [is_deleted] BIT NOT NULL CONSTRAINT [MaintenanceLog_is_deleted_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [MaintenanceLog_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [MaintenanceLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[MaintenanceOperation] (
    [id] NVARCHAR(1000) NOT NULL,
    [maintenanceLogId] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [cost] DECIMAL(10,2),
    [notes] NVARCHAR(1000),
    [is_deleted] BIT NOT NULL CONSTRAINT [MaintenanceOperation_is_deleted_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [MaintenanceOperation_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [MaintenanceOperation_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[MaintenancePrediction] (
    [id] NVARCHAR(1000) NOT NULL,
    [vehicleId] NVARCHAR(1000) NOT NULL,
    [maintenanceType] NVARCHAR(1000) NOT NULL,
    [predictedDueDate] DATETIME2,
    [predictedDueMileage] INT,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [MaintenancePrediction_status_df] DEFAULT 'PENDING',
    [is_deleted] BIT NOT NULL CONSTRAINT [MaintenancePrediction_is_deleted_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [MaintenancePrediction_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [MaintenancePrediction_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[FuelLog] (
    [id] NVARCHAR(1000) NOT NULL,
    [vehicleId] NVARCHAR(1000) NOT NULL,
    [date] DATETIME2 NOT NULL,
    [mileage] INT NOT NULL,
    [quantity] DECIMAL(8,2) NOT NULL,
    [unit] NVARCHAR(1000) NOT NULL CONSTRAINT [FuelLog_unit_df] DEFAULT 'LITER',
    [cost] DECIMAL(10,2) NOT NULL,
    [fullTank] BIT NOT NULL CONSTRAINT [FuelLog_fullTank_df] DEFAULT 1,
    [synced] BIT NOT NULL CONSTRAINT [FuelLog_synced_df] DEFAULT 1,
    [is_deleted] BIT NOT NULL CONSTRAINT [FuelLog_is_deleted_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [FuelLog_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [FuelLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Insurance] (
    [id] NVARCHAR(1000) NOT NULL,
    [vehicleId] NVARCHAR(1000) NOT NULL,
    [provider] NVARCHAR(1000) NOT NULL,
    [policyNumber] NVARCHAR(1000) NOT NULL,
    [startDate] DATETIME2 NOT NULL,
    [endDate] DATETIME2 NOT NULL,
    [cost] DECIMAL(10,2) NOT NULL,
    [is_deleted] BIT NOT NULL CONSTRAINT [Insurance_is_deleted_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Insurance_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [Insurance_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[VehicleTax] (
    [id] NVARCHAR(1000) NOT NULL,
    [vehicleId] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(1000) NOT NULL,
    [year] INT NOT NULL,
    [amount] DECIMAL(10,2) NOT NULL,
    [dueDate] DATETIME2 NOT NULL,
    [paid] BIT NOT NULL CONSTRAINT [VehicleTax_paid_df] DEFAULT 0,
    [is_deleted] BIT NOT NULL CONSTRAINT [VehicleTax_is_deleted_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [VehicleTax_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [VehicleTax_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ObdScan] (
    [id] NVARCHAR(1000) NOT NULL,
    [vehicleId] NVARCHAR(1000) NOT NULL,
    [scanDate] DATETIME2 NOT NULL CONSTRAINT [ObdScan_scanDate_df] DEFAULT CURRENT_TIMESTAMP,
    [rawData] NVARCHAR(max),
    [is_deleted] BIT NOT NULL CONSTRAINT [ObdScan_is_deleted_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [ObdScan_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [ObdScan_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ObdErrorCode] (
    [id] NVARCHAR(1000) NOT NULL,
    [obdScanId] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [severity] NVARCHAR(1000) NOT NULL CONSTRAINT [ObdErrorCode_severity_df] DEFAULT 'INFO',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [ObdErrorCode_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [ObdErrorCode_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[AiDiagnostic] (
    [id] NVARCHAR(1000) NOT NULL,
    [vehicleId] NVARCHAR(1000) NOT NULL,
    [prompt] NVARCHAR(1000),
    [aiResponse] NVARCHAR(max) NOT NULL,
    [is_deleted] BIT NOT NULL CONSTRAINT [AiDiagnostic_is_deleted_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [AiDiagnostic_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [AiDiagnostic_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Attachment] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [vehicleId] NVARCHAR(1000) NOT NULL,
    [maintenanceLogId] NVARCHAR(1000),
    [vehicleEventId] NVARCHAR(1000),
    [aiDiagnosticId] NVARCHAR(1000),
    [mediaType] NVARCHAR(1000) NOT NULL,
    [mimeType] NVARCHAR(1000) NOT NULL,
    [sizeBytes] INT NOT NULL,
    [storageKey] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Attachment_status_df] DEFAULT 'PENDING',
    [is_deleted] BIT NOT NULL CONSTRAINT [Attachment_is_deleted_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Attachment_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [Attachment_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[VehicleEvent] (
    [id] NVARCHAR(1000) NOT NULL,
    [vehicleId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000),
    [type] NVARCHAR(1000) NOT NULL,
    [note] NVARCHAR(1000),
    [amount] DECIMAL(10,2),
    [synced] BIT NOT NULL CONSTRAINT [VehicleEvent_synced_df] DEFAULT 1,
    [is_deleted] BIT NOT NULL CONSTRAINT [VehicleEvent_is_deleted_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [VehicleEvent_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [VehicleEvent_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Notification] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [vehicleId] NVARCHAR(1000),
    [type] NVARCHAR(1000) NOT NULL,
    [message] NVARCHAR(1000) NOT NULL,
    [sentAt] DATETIME2,
    [read] BIT NOT NULL CONSTRAINT [Notification_read_df] DEFAULT 0,
    [is_deleted] BIT NOT NULL CONSTRAINT [Notification_is_deleted_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [Notification_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [Notification_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [MaintenanceOperation_maintenanceLogId_type_idx] ON [dbo].[MaintenanceOperation]([maintenanceLogId], [type]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Attachment_vehicleId_idx] ON [dbo].[Attachment]([vehicleId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [VehicleEvent_vehicleId_type_idx] ON [dbo].[VehicleEvent]([vehicleId], [type]);

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[RefreshToken] ADD CONSTRAINT [RefreshToken_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Vehicle] ADD CONSTRAINT [Vehicle_ownerUserId_fkey] FOREIGN KEY ([ownerUserId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Vehicle] ADD CONSTRAINT [Vehicle_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[Company]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MaintenanceLog] ADD CONSTRAINT [MaintenanceLog_vehicleId_fkey] FOREIGN KEY ([vehicleId]) REFERENCES [dbo].[Vehicle]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MaintenanceOperation] ADD CONSTRAINT [MaintenanceOperation_maintenanceLogId_fkey] FOREIGN KEY ([maintenanceLogId]) REFERENCES [dbo].[MaintenanceLog]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MaintenancePrediction] ADD CONSTRAINT [MaintenancePrediction_vehicleId_fkey] FOREIGN KEY ([vehicleId]) REFERENCES [dbo].[Vehicle]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[FuelLog] ADD CONSTRAINT [FuelLog_vehicleId_fkey] FOREIGN KEY ([vehicleId]) REFERENCES [dbo].[Vehicle]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Insurance] ADD CONSTRAINT [Insurance_vehicleId_fkey] FOREIGN KEY ([vehicleId]) REFERENCES [dbo].[Vehicle]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[VehicleTax] ADD CONSTRAINT [VehicleTax_vehicleId_fkey] FOREIGN KEY ([vehicleId]) REFERENCES [dbo].[Vehicle]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ObdScan] ADD CONSTRAINT [ObdScan_vehicleId_fkey] FOREIGN KEY ([vehicleId]) REFERENCES [dbo].[Vehicle]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ObdErrorCode] ADD CONSTRAINT [ObdErrorCode_obdScanId_fkey] FOREIGN KEY ([obdScanId]) REFERENCES [dbo].[ObdScan]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AiDiagnostic] ADD CONSTRAINT [AiDiagnostic_vehicleId_fkey] FOREIGN KEY ([vehicleId]) REFERENCES [dbo].[Vehicle]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Attachment] ADD CONSTRAINT [Attachment_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Attachment] ADD CONSTRAINT [Attachment_vehicleId_fkey] FOREIGN KEY ([vehicleId]) REFERENCES [dbo].[Vehicle]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Attachment] ADD CONSTRAINT [Attachment_maintenanceLogId_fkey] FOREIGN KEY ([maintenanceLogId]) REFERENCES [dbo].[MaintenanceLog]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Attachment] ADD CONSTRAINT [Attachment_vehicleEventId_fkey] FOREIGN KEY ([vehicleEventId]) REFERENCES [dbo].[VehicleEvent]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Attachment] ADD CONSTRAINT [Attachment_aiDiagnosticId_fkey] FOREIGN KEY ([aiDiagnosticId]) REFERENCES [dbo].[AiDiagnostic]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[VehicleEvent] ADD CONSTRAINT [VehicleEvent_vehicleId_fkey] FOREIGN KEY ([vehicleId]) REFERENCES [dbo].[Vehicle]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[VehicleEvent] ADD CONSTRAINT [VehicleEvent_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Notification] ADD CONSTRAINT [Notification_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Notification] ADD CONSTRAINT [Notification_vehicleId_fkey] FOREIGN KEY ([vehicleId]) REFERENCES [dbo].[Vehicle]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
