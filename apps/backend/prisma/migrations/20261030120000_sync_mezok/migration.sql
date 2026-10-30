-- Szinkronizacios mezok + szerzo (createdByUserId) + refresh token hash.
--
-- Kezzel irt, adatmegorzo migracio (a Prisma altal generalt valtozat ket hibaval
-- elbukna SQL Serveren: nem dobja el az is_deleted oszlopok DEFAULT constraintjet,
-- es a NOT NULL createdByUserId-t meglevo sorokra nem tudja feltolteni).
--
-- Mit csinal a meglevo adatokkal:
--   * is_deleted = 1           -> deletedAt = updated_at, egyebkent NULL
--   * clientUpdatedAt          -> a sor updated_at erteke
--   * version (rowversion)     -> az SQL Server automatikusan kitolti
--   * createdByUserId          -> VehicleEvent/Attachment: a regi userId; a tobbi
--                                 tablaban a jarmu tulajdonosa
--   * RefreshToken.token       -> tokenHash = SHA-256 hex (a kiadott tokenek ervenyesek maradnak)
--
-- Az uj oszlopokra hivatkozo UPDATE-ek EXEC-ben futnak, mert az SQL Server az egesz
-- batchet elore leforditja, es az ALTER TABLE elott meg nem letezo oszlopot nem ismerne.

BEGIN TRY

BEGIN TRAN;

-- ---------- regi kapcsolatok, indexek ----------
ALTER TABLE [dbo].[Attachment] DROP CONSTRAINT [Attachment_userId_fkey];
ALTER TABLE [dbo].[VehicleEvent] DROP CONSTRAINT [VehicleEvent_userId_fkey];
DROP INDEX [Attachment_vehicleId_idx] ON [dbo].[Attachment];


-- ---------- Vehicle ----------
ALTER TABLE [dbo].[Vehicle] ADD [clientUpdatedAt] DATETIME2 NOT NULL CONSTRAINT [Vehicle_clientUpdatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [deletedAt] DATETIME2,
    [lastModifiedByDeviceId] NVARCHAR(64),
    [version] rowversion;
EXEC('UPDATE [dbo].[Vehicle] SET [clientUpdatedAt] = [updated_at], [deletedAt] = CASE WHEN [is_deleted] = 1 THEN [updated_at] END');
ALTER TABLE [dbo].[Vehicle] DROP CONSTRAINT [Vehicle_is_deleted_df];
ALTER TABLE [dbo].[Vehicle] DROP COLUMN [is_deleted];

-- ---------- MaintenanceLog ----------
ALTER TABLE [dbo].[MaintenanceLog] ADD [clientUpdatedAt] DATETIME2 NOT NULL CONSTRAINT [MaintenanceLog_clientUpdatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [deletedAt] DATETIME2,
    [lastModifiedByDeviceId] NVARCHAR(64),
    [version] rowversion,
    [createdByUserId] NVARCHAR(1000) NULL;
EXEC('UPDATE [dbo].[MaintenanceLog] SET [clientUpdatedAt] = [updated_at], [deletedAt] = CASE WHEN [is_deleted] = 1 THEN [updated_at] END');
EXEC('UPDATE x SET [createdByUserId] = v.[ownerUserId] FROM [dbo].[MaintenanceLog] x JOIN [dbo].[Vehicle] v ON v.[id] = x.[vehicleId]');
EXEC('ALTER TABLE [dbo].[MaintenanceLog] ALTER COLUMN [createdByUserId] NVARCHAR(1000) NOT NULL');
ALTER TABLE [dbo].[MaintenanceLog] DROP CONSTRAINT [MaintenanceLog_is_deleted_df];
ALTER TABLE [dbo].[MaintenanceLog] DROP COLUMN [is_deleted];

-- ---------- MaintenanceOperation ----------
ALTER TABLE [dbo].[MaintenanceOperation] ADD [clientUpdatedAt] DATETIME2 NOT NULL CONSTRAINT [MaintenanceOperation_clientUpdatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [deletedAt] DATETIME2,
    [lastModifiedByDeviceId] NVARCHAR(64),
    [version] rowversion;
EXEC('UPDATE [dbo].[MaintenanceOperation] SET [clientUpdatedAt] = [updated_at], [deletedAt] = CASE WHEN [is_deleted] = 1 THEN [updated_at] END');
ALTER TABLE [dbo].[MaintenanceOperation] DROP CONSTRAINT [MaintenanceOperation_is_deleted_df];
ALTER TABLE [dbo].[MaintenanceOperation] DROP COLUMN [is_deleted];

-- ---------- MaintenancePrediction ----------
ALTER TABLE [dbo].[MaintenancePrediction] ADD [clientUpdatedAt] DATETIME2 NOT NULL CONSTRAINT [MaintenancePrediction_clientUpdatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [deletedAt] DATETIME2,
    [lastModifiedByDeviceId] NVARCHAR(64),
    [version] rowversion;
EXEC('UPDATE [dbo].[MaintenancePrediction] SET [clientUpdatedAt] = [updated_at], [deletedAt] = CASE WHEN [is_deleted] = 1 THEN [updated_at] END');
ALTER TABLE [dbo].[MaintenancePrediction] DROP CONSTRAINT [MaintenancePrediction_is_deleted_df];
ALTER TABLE [dbo].[MaintenancePrediction] DROP COLUMN [is_deleted];

-- ---------- FuelLog ----------
ALTER TABLE [dbo].[FuelLog] ADD [clientUpdatedAt] DATETIME2 NOT NULL CONSTRAINT [FuelLog_clientUpdatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [deletedAt] DATETIME2,
    [lastModifiedByDeviceId] NVARCHAR(64),
    [version] rowversion,
    [createdByUserId] NVARCHAR(1000) NULL;
EXEC('UPDATE [dbo].[FuelLog] SET [clientUpdatedAt] = [updated_at], [deletedAt] = CASE WHEN [is_deleted] = 1 THEN [updated_at] END');
EXEC('UPDATE x SET [createdByUserId] = v.[ownerUserId] FROM [dbo].[FuelLog] x JOIN [dbo].[Vehicle] v ON v.[id] = x.[vehicleId]');
EXEC('ALTER TABLE [dbo].[FuelLog] ALTER COLUMN [createdByUserId] NVARCHAR(1000) NOT NULL');
ALTER TABLE [dbo].[FuelLog] DROP CONSTRAINT [FuelLog_is_deleted_df];
ALTER TABLE [dbo].[FuelLog] DROP COLUMN [is_deleted];

-- ---------- Insurance ----------
ALTER TABLE [dbo].[Insurance] ADD [clientUpdatedAt] DATETIME2 NOT NULL CONSTRAINT [Insurance_clientUpdatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [deletedAt] DATETIME2,
    [lastModifiedByDeviceId] NVARCHAR(64),
    [version] rowversion,
    [createdByUserId] NVARCHAR(1000) NULL;
EXEC('UPDATE [dbo].[Insurance] SET [clientUpdatedAt] = [updated_at], [deletedAt] = CASE WHEN [is_deleted] = 1 THEN [updated_at] END');
EXEC('UPDATE x SET [createdByUserId] = v.[ownerUserId] FROM [dbo].[Insurance] x JOIN [dbo].[Vehicle] v ON v.[id] = x.[vehicleId]');
EXEC('ALTER TABLE [dbo].[Insurance] ALTER COLUMN [createdByUserId] NVARCHAR(1000) NOT NULL');
ALTER TABLE [dbo].[Insurance] DROP CONSTRAINT [Insurance_is_deleted_df];
ALTER TABLE [dbo].[Insurance] DROP COLUMN [is_deleted];

-- ---------- VehicleTax ----------
ALTER TABLE [dbo].[VehicleTax] ADD [clientUpdatedAt] DATETIME2 NOT NULL CONSTRAINT [VehicleTax_clientUpdatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [deletedAt] DATETIME2,
    [lastModifiedByDeviceId] NVARCHAR(64),
    [version] rowversion,
    [createdByUserId] NVARCHAR(1000) NULL;
EXEC('UPDATE [dbo].[VehicleTax] SET [clientUpdatedAt] = [updated_at], [deletedAt] = CASE WHEN [is_deleted] = 1 THEN [updated_at] END');
EXEC('UPDATE x SET [createdByUserId] = v.[ownerUserId] FROM [dbo].[VehicleTax] x JOIN [dbo].[Vehicle] v ON v.[id] = x.[vehicleId]');
EXEC('ALTER TABLE [dbo].[VehicleTax] ALTER COLUMN [createdByUserId] NVARCHAR(1000) NOT NULL');
ALTER TABLE [dbo].[VehicleTax] DROP CONSTRAINT [VehicleTax_is_deleted_df];
ALTER TABLE [dbo].[VehicleTax] DROP COLUMN [is_deleted];

-- ---------- ObdScan ----------
ALTER TABLE [dbo].[ObdScan] ADD [clientUpdatedAt] DATETIME2 NOT NULL CONSTRAINT [ObdScan_clientUpdatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [deletedAt] DATETIME2,
    [lastModifiedByDeviceId] NVARCHAR(64),
    [version] rowversion,
    [createdByUserId] NVARCHAR(1000) NULL;
EXEC('UPDATE [dbo].[ObdScan] SET [clientUpdatedAt] = [updated_at], [deletedAt] = CASE WHEN [is_deleted] = 1 THEN [updated_at] END');
EXEC('UPDATE x SET [createdByUserId] = v.[ownerUserId] FROM [dbo].[ObdScan] x JOIN [dbo].[Vehicle] v ON v.[id] = x.[vehicleId]');
EXEC('ALTER TABLE [dbo].[ObdScan] ALTER COLUMN [createdByUserId] NVARCHAR(1000) NOT NULL');
ALTER TABLE [dbo].[ObdScan] DROP CONSTRAINT [ObdScan_is_deleted_df];
ALTER TABLE [dbo].[ObdScan] DROP COLUMN [is_deleted];

-- ---------- ObdErrorCode ----------
ALTER TABLE [dbo].[ObdErrorCode] ADD [clientUpdatedAt] DATETIME2 NOT NULL CONSTRAINT [ObdErrorCode_clientUpdatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [deletedAt] DATETIME2,
    [lastModifiedByDeviceId] NVARCHAR(64),
    [version] rowversion;
EXEC('UPDATE [dbo].[ObdErrorCode] SET [clientUpdatedAt] = [updated_at]');

-- ---------- AiDiagnostic ----------
ALTER TABLE [dbo].[AiDiagnostic] ADD [clientUpdatedAt] DATETIME2 NOT NULL CONSTRAINT [AiDiagnostic_clientUpdatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [deletedAt] DATETIME2,
    [lastModifiedByDeviceId] NVARCHAR(64),
    [version] rowversion,
    [createdByUserId] NVARCHAR(1000) NULL;
EXEC('UPDATE [dbo].[AiDiagnostic] SET [clientUpdatedAt] = [updated_at], [deletedAt] = CASE WHEN [is_deleted] = 1 THEN [updated_at] END');
EXEC('UPDATE x SET [createdByUserId] = v.[ownerUserId] FROM [dbo].[AiDiagnostic] x JOIN [dbo].[Vehicle] v ON v.[id] = x.[vehicleId]');
EXEC('ALTER TABLE [dbo].[AiDiagnostic] ALTER COLUMN [createdByUserId] NVARCHAR(1000) NOT NULL');
ALTER TABLE [dbo].[AiDiagnostic] DROP CONSTRAINT [AiDiagnostic_is_deleted_df];
ALTER TABLE [dbo].[AiDiagnostic] DROP COLUMN [is_deleted];

-- ---------- Attachment ----------
ALTER TABLE [dbo].[Attachment] ADD [clientUpdatedAt] DATETIME2 NOT NULL CONSTRAINT [Attachment_clientUpdatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [deletedAt] DATETIME2,
    [lastModifiedByDeviceId] NVARCHAR(64),
    [version] rowversion,
    [createdByUserId] NVARCHAR(1000) NULL;
EXEC('UPDATE [dbo].[Attachment] SET [clientUpdatedAt] = [updated_at], [deletedAt] = CASE WHEN [is_deleted] = 1 THEN [updated_at] END');
EXEC('UPDATE x SET [createdByUserId] = x.[userId] FROM [dbo].[Attachment] x JOIN [dbo].[Vehicle] v ON v.[id] = x.[vehicleId]');
EXEC('ALTER TABLE [dbo].[Attachment] ALTER COLUMN [createdByUserId] NVARCHAR(1000) NOT NULL');
ALTER TABLE [dbo].[Attachment] DROP CONSTRAINT [Attachment_is_deleted_df];
ALTER TABLE [dbo].[Attachment] DROP COLUMN [is_deleted];
ALTER TABLE [dbo].[Attachment] DROP COLUMN [userId];

-- ---------- VehicleEvent ----------
ALTER TABLE [dbo].[VehicleEvent] ADD [clientUpdatedAt] DATETIME2 NOT NULL CONSTRAINT [VehicleEvent_clientUpdatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [deletedAt] DATETIME2,
    [lastModifiedByDeviceId] NVARCHAR(64),
    [version] rowversion,
    [createdByUserId] NVARCHAR(1000) NULL;
EXEC('UPDATE [dbo].[VehicleEvent] SET [clientUpdatedAt] = [updated_at], [deletedAt] = CASE WHEN [is_deleted] = 1 THEN [updated_at] END');
EXEC('UPDATE x SET [createdByUserId] = COALESCE(x.[userId], v.[ownerUserId]) FROM [dbo].[VehicleEvent] x JOIN [dbo].[Vehicle] v ON v.[id] = x.[vehicleId]');
EXEC('ALTER TABLE [dbo].[VehicleEvent] ALTER COLUMN [createdByUserId] NVARCHAR(1000) NOT NULL');
ALTER TABLE [dbo].[VehicleEvent] DROP CONSTRAINT [VehicleEvent_is_deleted_df];
ALTER TABLE [dbo].[VehicleEvent] DROP COLUMN [is_deleted];
ALTER TABLE [dbo].[VehicleEvent] DROP COLUMN [userId];

-- ---------- Notification ----------
ALTER TABLE [dbo].[Notification] ADD [clientUpdatedAt] DATETIME2 NOT NULL CONSTRAINT [Notification_clientUpdatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [deletedAt] DATETIME2,
    [lastModifiedByDeviceId] NVARCHAR(64),
    [version] rowversion;
EXEC('UPDATE [dbo].[Notification] SET [clientUpdatedAt] = [updated_at], [deletedAt] = CASE WHEN [is_deleted] = 1 THEN [updated_at] END');
ALTER TABLE [dbo].[Notification] DROP CONSTRAINT [Notification_is_deleted_df];
ALTER TABLE [dbo].[Notification] DROP COLUMN [is_deleted];

-- ---------- RefreshToken: nyers token helyett SHA-256 hash ----------
ALTER TABLE [dbo].[RefreshToken] ADD [deviceId] NVARCHAR(64),
    [tokenHash] NVARCHAR(64) NULL;
EXEC('UPDATE [dbo].[RefreshToken] SET [tokenHash] = LOWER(CONVERT(NVARCHAR(64), HASHBYTES(''SHA2_256'', CONVERT(VARCHAR(1000), [token])), 2))');
EXEC('ALTER TABLE [dbo].[RefreshToken] ALTER COLUMN [tokenHash] NVARCHAR(64) NOT NULL');
ALTER TABLE [dbo].[RefreshToken] DROP CONSTRAINT [RefreshToken_token_key];
ALTER TABLE [dbo].[RefreshToken] DROP COLUMN [token];
EXEC('ALTER TABLE [dbo].[RefreshToken] ADD CONSTRAINT [RefreshToken_tokenHash_key] UNIQUE NONCLUSTERED ([tokenHash])');
CREATE NONCLUSTERED INDEX [RefreshToken_userId_idx] ON [dbo].[RefreshToken]([userId]);

-- ---------- uj tablak ----------
CREATE TABLE [dbo].[SyncMutation] (
    [mutationId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [deviceId] NVARCHAR(64),
    [entity] NVARCHAR(64) NOT NULL,
    [entityId] NVARCHAR(1000) NOT NULL,
    [result] NVARCHAR(max) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [SyncMutation_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [SyncMutation_pkey] PRIMARY KEY CLUSTERED ([mutationId])
);
CREATE NONCLUSTERED INDEX [SyncMutation_created_at_idx] ON [dbo].[SyncMutation]([created_at]);

CREATE TABLE [dbo].[SyncState] (
    [key] NVARCHAR(64) NOT NULL,
    [value] NVARCHAR(1000) NOT NULL,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [SyncState_pkey] PRIMARY KEY CLUSTERED ([key])
);

-- ---------- pull indexek (szuro oszlop + version) ----------
EXEC('CREATE NONCLUSTERED INDEX [Vehicle_ownerUserId_version_idx] ON [dbo].[Vehicle]([ownerUserId], [version])');
EXEC('CREATE NONCLUSTERED INDEX [MaintenanceLog_vehicleId_version_idx] ON [dbo].[MaintenanceLog]([vehicleId], [version])');
EXEC('CREATE NONCLUSTERED INDEX [MaintenanceOperation_maintenanceLogId_version_idx] ON [dbo].[MaintenanceOperation]([maintenanceLogId], [version])');
EXEC('CREATE NONCLUSTERED INDEX [MaintenancePrediction_vehicleId_version_idx] ON [dbo].[MaintenancePrediction]([vehicleId], [version])');
EXEC('CREATE NONCLUSTERED INDEX [FuelLog_vehicleId_version_idx] ON [dbo].[FuelLog]([vehicleId], [version])');
EXEC('CREATE NONCLUSTERED INDEX [Insurance_vehicleId_version_idx] ON [dbo].[Insurance]([vehicleId], [version])');
EXEC('CREATE NONCLUSTERED INDEX [VehicleTax_vehicleId_version_idx] ON [dbo].[VehicleTax]([vehicleId], [version])');
EXEC('CREATE NONCLUSTERED INDEX [ObdScan_vehicleId_version_idx] ON [dbo].[ObdScan]([vehicleId], [version])');
EXEC('CREATE NONCLUSTERED INDEX [ObdErrorCode_obdScanId_version_idx] ON [dbo].[ObdErrorCode]([obdScanId], [version])');
EXEC('CREATE NONCLUSTERED INDEX [AiDiagnostic_vehicleId_version_idx] ON [dbo].[AiDiagnostic]([vehicleId], [version])');
EXEC('CREATE NONCLUSTERED INDEX [Attachment_vehicleId_version_idx] ON [dbo].[Attachment]([vehicleId], [version])');
EXEC('CREATE NONCLUSTERED INDEX [VehicleEvent_vehicleId_version_idx] ON [dbo].[VehicleEvent]([vehicleId], [version])');
EXEC('CREATE NONCLUSTERED INDEX [Notification_userId_version_idx] ON [dbo].[Notification]([userId], [version])');
CREATE NONCLUSTERED INDEX [Vehicle_companyId_idx] ON [dbo].[Vehicle]([companyId]);

-- ---------- szerzo kapcsolatok ----------
ALTER TABLE [dbo].[MaintenanceLog] ADD CONSTRAINT [MaintenanceLog_createdByUserId_fkey] FOREIGN KEY ([createdByUserId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[FuelLog] ADD CONSTRAINT [FuelLog_createdByUserId_fkey] FOREIGN KEY ([createdByUserId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Insurance] ADD CONSTRAINT [Insurance_createdByUserId_fkey] FOREIGN KEY ([createdByUserId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[VehicleTax] ADD CONSTRAINT [VehicleTax_createdByUserId_fkey] FOREIGN KEY ([createdByUserId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ObdScan] ADD CONSTRAINT [ObdScan_createdByUserId_fkey] FOREIGN KEY ([createdByUserId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[AiDiagnostic] ADD CONSTRAINT [AiDiagnostic_createdByUserId_fkey] FOREIGN KEY ([createdByUserId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Attachment] ADD CONSTRAINT [Attachment_createdByUserId_fkey] FOREIGN KEY ([createdByUserId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[VehicleEvent] ADD CONSTRAINT [VehicleEvent_createdByUserId_fkey] FOREIGN KEY ([createdByUserId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[SyncMutation] ADD CONSTRAINT [SyncMutation_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
