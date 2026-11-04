-- Tanari eszrevetelek alapjan (2026-11-04):
--   1. enumok helyett kodtablak (FK vedi az erteket)
--   2. Attachment: a redundans vehicleId es createdByUserId kikerul, a harom
--      szulo-FK kozul pontosan egy kitoltese kotelezo (CHECK constraint)
--   3. trigger: MaintenanceLog.totalCost automatikus szamolasa
--   4. view-k a lekerdezesekhez / riportokhoz
--   5. tovabbi redundancia megszuntetese: a szerveren mindig true synced mezo
--      kikerul, es az Attachment.mediaType is (a mimeType-bol kovetkezik)
--
-- Kezzel irt migracio. A Prisma altal generalt reszek (tablak, FK-k, indexek)
-- nevei megegyeznek azzal, amit a Prisma var, igy nincs drift. A CHECK, a
-- trigger es a view-k a Prisma semaban nem szerepelnek (a Prisma nem kezeli oket).
-- A CREATE VIEW / CREATE TRIGGER csak egy batch elso utasitasa lehet, a Prisma
-- viszont egy batchkent futtatja a fajlt, ezert ezek EXEC(N'...')-ben vannak.

BEGIN TRY

BEGIN TRAN;

-- ======================================================================
-- 1. KODTABLAK
-- ======================================================================

CREATE TABLE [dbo].[UserRole] (
    [code] NVARCHAR(32) NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    CONSTRAINT [UserRole_pkey] PRIMARY KEY CLUSTERED ([code])
);
CREATE TABLE [dbo].[FuelType] (
    [code] NVARCHAR(32) NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    CONSTRAINT [FuelType_pkey] PRIMARY KEY CLUSTERED ([code])
);
CREATE TABLE [dbo].[MaintenanceType] (
    [code] NVARCHAR(32) NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    CONSTRAINT [MaintenanceType_pkey] PRIMARY KEY CLUSTERED ([code])
);
CREATE TABLE [dbo].[PredictionStatus] (
    [code] NVARCHAR(32) NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    CONSTRAINT [PredictionStatus_pkey] PRIMARY KEY CLUSTERED ([code])
);
CREATE TABLE [dbo].[FuelUnit] (
    [code] NVARCHAR(32) NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    CONSTRAINT [FuelUnit_pkey] PRIMARY KEY CLUSTERED ([code])
);
CREATE TABLE [dbo].[VehicleTaxCategory] (
    [code] NVARCHAR(32) NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    CONSTRAINT [VehicleTaxCategory_pkey] PRIMARY KEY CLUSTERED ([code])
);
CREATE TABLE [dbo].[Severity] (
    [code] NVARCHAR(32) NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    CONSTRAINT [Severity_pkey] PRIMARY KEY CLUSTERED ([code])
);
CREATE TABLE [dbo].[UploadStatus] (
    [code] NVARCHAR(32) NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    CONSTRAINT [UploadStatus_pkey] PRIMARY KEY CLUSTERED ([code])
);
CREATE TABLE [dbo].[NotificationType] (
    [code] NVARCHAR(32) NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    CONSTRAINT [NotificationType_pkey] PRIMARY KEY CLUSTERED ([code])
);

-- A kodtablak tartalma (a korabbi enum ertekek)
INSERT INTO [dbo].[UserRole] ([code], [name]) VALUES
    (N'PRIVATE', N'Magánszemély'),
    (N'COMPANY_ADMIN', N'Céges adminisztrátor'),
    (N'COMPANY_MEMBER', N'Céges tag');
INSERT INTO [dbo].[FuelType] ([code], [name]) VALUES
    (N'GASOLINE', N'Benzin'),
    (N'DIESEL', N'Dízel'),
    (N'ELECTRIC', N'Elektromos'),
    (N'HYBRID', N'Hibrid'),
    (N'LPG', N'LPG (autógáz)');
INSERT INTO [dbo].[MaintenanceType] ([code], [name]) VALUES
    (N'OIL_CHANGE', N'Olajcsere'),
    (N'TIRE_ROTATION', N'Gumiforgatás'),
    (N'TIRE_REPLACEMENT', N'Gumicsere'),
    (N'BRAKE_SERVICE', N'Fékjavítás'),
    (N'BATTERY', N'Akkumulátor'),
    (N'FILTER_CHANGE', N'Szűrőcsere'),
    (N'INSPECTION', N'Műszaki vizsga / átvizsgálás'),
    (N'OTHER', N'Egyéb');
INSERT INTO [dbo].[PredictionStatus] ([code], [name]) VALUES
    (N'PENDING', N'Függőben'),
    (N'NOTIFIED', N'Értesítve'),
    (N'COMPLETED', N'Elvégezve'),
    (N'DISMISSED', N'Elvetve');
INSERT INTO [dbo].[FuelUnit] ([code], [name]) VALUES
    (N'LITER', N'Liter'),
    (N'KWH', N'Kilowattóra'),
    (N'GALLON', N'Gallon');
INSERT INTO [dbo].[VehicleTaxCategory] ([code], [name]) VALUES
    (N'CATEGORY_A', N'A kategória'),
    (N'CATEGORY_B', N'B kategória'),
    (N'CATEGORY_C', N'C kategória'),
    (N'CATEGORY_D', N'D kategória'),
    (N'CATEGORY_E', N'E kategória'),
    (N'CATEGORY_F', N'F kategória'),
    (N'CATEGORY_G', N'G kategória'),
    (N'CATEGORY_H', N'H kategória'),
    (N'OTHER', N'Egyéb');
INSERT INTO [dbo].[Severity] ([code], [name]) VALUES
    (N'INFO', N'Információ'),
    (N'WARNING', N'Figyelmeztetés'),
    (N'CRITICAL', N'Kritikus');
INSERT INTO [dbo].[UploadStatus] ([code], [name]) VALUES
    (N'PENDING', N'Feltöltésre vár'),
    (N'UPLOADED', N'Feltöltve'),
    (N'FAILED', N'Sikertelen');
INSERT INTO [dbo].[NotificationType] ([code], [name]) VALUES
    (N'MAINTENANCE_DUE', N'Esedékes karbantartás'),
    (N'WEEKLY_MILEAGE', N'Heti km-állás'),
    (N'INSURANCE_EXPIRY', N'Lejáró biztosítás'),
    (N'TAX_DUE', N'Esedékes rovinieta'),
    (N'OBD_ALERT', N'OBD riasztás');

-- A hivatkozo oszlopok: nvarchar(1000) -> nvarchar(32), mert az FK azonos
-- tipust es hosszt ker. Az indexet, ami az oszlopot tartalmazza, elobb el kell dobni.
DROP INDEX [MaintenanceOperation_maintenanceLogId_type_idx] ON [dbo].[MaintenanceOperation];

ALTER TABLE [dbo].[User] ALTER COLUMN [role] NVARCHAR(32) NOT NULL;
ALTER TABLE [dbo].[Vehicle] ALTER COLUMN [fuelType] NVARCHAR(32) NOT NULL;
ALTER TABLE [dbo].[MaintenanceOperation] ALTER COLUMN [type] NVARCHAR(32) NOT NULL;
ALTER TABLE [dbo].[MaintenancePrediction] ALTER COLUMN [maintenanceType] NVARCHAR(32) NOT NULL;
ALTER TABLE [dbo].[MaintenancePrediction] ALTER COLUMN [status] NVARCHAR(32) NOT NULL;
ALTER TABLE [dbo].[FuelLog] ALTER COLUMN [unit] NVARCHAR(32) NOT NULL;
ALTER TABLE [dbo].[VehicleTax] ALTER COLUMN [category] NVARCHAR(32) NOT NULL;
ALTER TABLE [dbo].[ObdErrorCode] ALTER COLUMN [severity] NVARCHAR(32) NOT NULL;
ALTER TABLE [dbo].[Attachment] ALTER COLUMN [status] NVARCHAR(32) NOT NULL;
ALTER TABLE [dbo].[Notification] ALTER COLUMN [type] NVARCHAR(32) NOT NULL;

CREATE NONCLUSTERED INDEX [MaintenanceOperation_maintenanceLogId_type_idx] ON [dbo].[MaintenanceOperation]([maintenanceLogId], [type]);

-- Idegen kulcsok a kodtablakra
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_role_fkey] FOREIGN KEY ([role]) REFERENCES [dbo].[UserRole]([code]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Vehicle] ADD CONSTRAINT [Vehicle_fuelType_fkey] FOREIGN KEY ([fuelType]) REFERENCES [dbo].[FuelType]([code]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[MaintenanceOperation] ADD CONSTRAINT [MaintenanceOperation_type_fkey] FOREIGN KEY ([type]) REFERENCES [dbo].[MaintenanceType]([code]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[MaintenancePrediction] ADD CONSTRAINT [MaintenancePrediction_maintenanceType_fkey] FOREIGN KEY ([maintenanceType]) REFERENCES [dbo].[MaintenanceType]([code]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[MaintenancePrediction] ADD CONSTRAINT [MaintenancePrediction_status_fkey] FOREIGN KEY ([status]) REFERENCES [dbo].[PredictionStatus]([code]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[FuelLog] ADD CONSTRAINT [FuelLog_unit_fkey] FOREIGN KEY ([unit]) REFERENCES [dbo].[FuelUnit]([code]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[VehicleTax] ADD CONSTRAINT [VehicleTax_category_fkey] FOREIGN KEY ([category]) REFERENCES [dbo].[VehicleTaxCategory]([code]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ObdErrorCode] ADD CONSTRAINT [ObdErrorCode_severity_fkey] FOREIGN KEY ([severity]) REFERENCES [dbo].[Severity]([code]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Attachment] ADD CONSTRAINT [Attachment_status_fkey] FOREIGN KEY ([status]) REFERENCES [dbo].[UploadStatus]([code]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Notification] ADD CONSTRAINT [Notification_type_fkey] FOREIGN KEY ([type]) REFERENCES [dbo].[NotificationType]([code]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ======================================================================
-- 2. ATTACHMENT: redundans oszlopok ki, pontosan egy szulo kotelezo
-- ======================================================================
-- vehicleId, createdByUserId: a szulobol (log / esemeny / AI) kovetkezik.
-- mediaType: a mimeType elejebol kovetkezik (image/... = kep, video/... = video).

ALTER TABLE [dbo].[Attachment] DROP CONSTRAINT [Attachment_createdByUserId_fkey];
ALTER TABLE [dbo].[Attachment] DROP CONSTRAINT [Attachment_vehicleId_fkey];
DROP INDEX [Attachment_vehicleId_version_idx] ON [dbo].[Attachment];
ALTER TABLE [dbo].[Attachment] DROP COLUMN [createdByUserId], [vehicleId], [mediaType];

CREATE NONCLUSTERED INDEX [Attachment_maintenanceLogId_idx] ON [dbo].[Attachment]([maintenanceLogId]);
CREATE NONCLUSTERED INDEX [Attachment_vehicleEventId_idx] ON [dbo].[Attachment]([vehicleEventId]);
CREATE NONCLUSTERED INDEX [Attachment_aiDiagnosticId_idx] ON [dbo].[Attachment]([aiDiagnosticId]);
CREATE NONCLUSTERED INDEX [Attachment_version_idx] ON [dbo].[Attachment]([version]);

-- A harom szulo kozul pontosan egy van kitoltve (se nulla, se ketto).
-- Ehhez nem kell trigger: egy soron beluli szabaly, a CHECK constraint
-- deklarativ, gyorsabb, es a meglevo sorokat is ellenorzi (WITH CHECK).
ALTER TABLE [dbo].[Attachment] WITH CHECK ADD CONSTRAINT [Attachment_pontosan_egy_szulo] CHECK (
      (CASE WHEN [maintenanceLogId] IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN [vehicleEventId]   IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN [aiDiagnosticId]   IS NOT NULL THEN 1 ELSE 0 END) = 1
);

-- Csak kep vagy video toltheto fel (a mediaType oszlop helyett).
ALTER TABLE [dbo].[Attachment] WITH CHECK ADD CONSTRAINT [Attachment_kep_vagy_video] CHECK (
    [mimeType] LIKE N'image/%' OR [mimeType] LIKE N'video/%'
);

-- A synced mezo a szerveren mindig true volt (csak a mobil SQLite-ban van
-- ertelme), ezert itt redundans. Elobb az alapertelmezes (DEFAULT) megkotest
-- kell eldobni, kulonben az oszlop nem torolheto.
ALTER TABLE [dbo].[MaintenanceLog] DROP CONSTRAINT [MaintenanceLog_synced_df];
ALTER TABLE [dbo].[MaintenanceLog] DROP COLUMN [synced];
ALTER TABLE [dbo].[FuelLog] DROP CONSTRAINT [FuelLog_synced_df];
ALTER TABLE [dbo].[FuelLog] DROP COLUMN [synced];
ALTER TABLE [dbo].[VehicleEvent] DROP CONSTRAINT [VehicleEvent_synced_df];
ALTER TABLE [dbo].[VehicleEvent] DROP COLUMN [synced];

-- ======================================================================
-- 3. TRIGGER: MaintenanceLog.totalCost = a nem torolt muveletek osszege
-- ======================================================================
-- Minden MaintenanceOperation INSERT/UPDATE/DELETE utan ujraszamolja az
-- erintett szervizlatogatasok osszeget (halmazalapu: tobb soros muveletnel is jo).
-- A soft delete (deletedAt kitoltese) UPDATE, ezert az is ujraszamol.
-- A MaintenanceLog modositasa a version (rowversion) erteket is noveli, igy
-- az uj osszeg a szinkronnal eljut a mobilokra.

EXEC(N'
CREATE TRIGGER [dbo].[trg_MaintenanceOperation_totalCost]
ON [dbo].[MaintenanceOperation]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE ml
    SET ml.[totalCost] = (
        SELECT SUM(o.[cost])
        FROM [dbo].[MaintenanceOperation] o
        WHERE o.[maintenanceLogId] = ml.[id] AND o.[deletedAt] IS NULL
    )
    FROM [dbo].[MaintenanceLog] ml
    WHERE ml.[id] IN (
        SELECT [maintenanceLogId] FROM inserted
        UNION
        SELECT [maintenanceLogId] FROM deleted
    );
END
');

-- A meglevo adatok osszegeinek egyszeri ujraszamolasa
UPDATE ml
SET ml.[totalCost] = (
    SELECT SUM(o.[cost])
    FROM [dbo].[MaintenanceOperation] o
    WHERE o.[maintenanceLogId] = ml.[id] AND o.[deletedAt] IS NULL
)
FROM [dbo].[MaintenanceLog] ml;

-- ======================================================================
-- 4. VIEW-K
-- ======================================================================

-- Csatolmany a jarmuvel es a szerzovel, amit a szulobol szarmaztat, es a
-- mediaType-pal (IMAGE / VIDEO), amit a mimeType-bol szamol.
-- Ezzel szur a szinkron (pull) es a jogosultsag-ellenorzes jarmu szerint.
EXEC(N'
CREATE VIEW [dbo].[v_AttachmentWithVehicle] AS
SELECT
    a.[id],
    COALESCE(ml.[vehicleId], ve.[vehicleId], ad.[vehicleId])                   AS [vehicleId],
    COALESCE(ml.[createdByUserId], ve.[createdByUserId], ad.[createdByUserId]) AS [createdByUserId],
    a.[maintenanceLogId],
    a.[vehicleEventId],
    a.[aiDiagnosticId],
    CASE WHEN a.[mimeType] LIKE N''video/%'' THEN N''VIDEO'' ELSE N''IMAGE'' END AS [mediaType],
    a.[mimeType],
    a.[sizeBytes],
    a.[storageKey],
    a.[status],
    a.[clientUpdatedAt],
    a.[version],
    a.[deletedAt],
    a.[lastModifiedByDeviceId],
    a.[created_at],
    a.[updated_at]
FROM [dbo].[Attachment] a
LEFT JOIN [dbo].[MaintenanceLog] ml ON ml.[id] = a.[maintenanceLogId]
LEFT JOIN [dbo].[VehicleEvent]   ve ON ve.[id] = a.[vehicleEventId]
LEFT JOIN [dbo].[AiDiagnostic]   ad ON ad.[id] = a.[aiDiagnosticId]
');

-- Egy jarmu minden koltsegtetele egy listaban (a torolt sorok nelkul).
-- category: MAINTENANCE | FUEL | INSURANCE | VEHICLE_TAX | OTHER
-- Egyszerusites: a biztositas a kezdo honapjahoz, a rovinieta az esedekesseghez,
-- az esemeny a rogzitesi idejehez tartozik.
EXEC(N'
CREATE VIEW [dbo].[v_VehicleExpense] AS
SELECT ml.[vehicleId], ml.[serviceDate] AS [expenseDate], N''MAINTENANCE'' AS [category],
       ml.[totalCost] AS [amount], ml.[id] AS [sourceId]
FROM [dbo].[MaintenanceLog] ml
WHERE ml.[deletedAt] IS NULL AND ml.[totalCost] IS NOT NULL
UNION ALL
SELECT f.[vehicleId], f.[date], N''FUEL'', f.[cost], f.[id]
FROM [dbo].[FuelLog] f
WHERE f.[deletedAt] IS NULL
UNION ALL
SELECT i.[vehicleId], i.[startDate], N''INSURANCE'', i.[cost], i.[id]
FROM [dbo].[Insurance] i
WHERE i.[deletedAt] IS NULL
UNION ALL
SELECT t.[vehicleId], t.[dueDate], N''VEHICLE_TAX'', t.[amount], t.[id]
FROM [dbo].[VehicleTax] t
WHERE t.[deletedAt] IS NULL
UNION ALL
SELECT e.[vehicleId], e.[created_at], N''OTHER'', e.[amount], e.[id]
FROM [dbo].[VehicleEvent] e
WHERE e.[deletedAt] IS NULL AND e.[amount] IS NOT NULL
');

-- Havi koltsegosszesito jarmuvenkent, kategoriankenti bontassal (RON).
EXEC(N'
CREATE VIEW [dbo].[v_VehicleMonthlyCost] AS
SELECT
    x.[vehicleId],
    YEAR(x.[expenseDate])  AS [year],
    MONTH(x.[expenseDate]) AS [month],
    SUM(CASE WHEN x.[category] = N''MAINTENANCE'' THEN x.[amount] ELSE 0 END) AS [maintenanceCost],
    SUM(CASE WHEN x.[category] = N''FUEL''        THEN x.[amount] ELSE 0 END) AS [fuelCost],
    SUM(CASE WHEN x.[category] = N''INSURANCE''   THEN x.[amount] ELSE 0 END) AS [insuranceCost],
    SUM(CASE WHEN x.[category] = N''VEHICLE_TAX'' THEN x.[amount] ELSE 0 END) AS [taxCost],
    SUM(CASE WHEN x.[category] = N''OTHER''       THEN x.[amount] ELSE 0 END) AS [otherCost],
    SUM(x.[amount]) AS [totalCost]
FROM [dbo].[v_VehicleExpense] x
GROUP BY x.[vehicleId], YEAR(x.[expenseDate]), MONTH(x.[expenseDate])
');

-- Jarmuvenkent es karbantartas-tipusonkent a legutobbi elvegzes
-- (datum, km-allas, koltseg). Ebbol szamolhato a kovetkezo esedekesseg
-- (MaintenancePrediction).
EXEC(N'
CREATE VIEW [dbo].[v_LastMaintenanceByType] AS
WITH ranked AS (
    SELECT
        ml.[vehicleId],
        o.[type],
        ml.[serviceDate],
        ml.[mileageAtService],
        o.[cost],
        ml.[id] AS [maintenanceLogId],
        ROW_NUMBER() OVER (
            PARTITION BY ml.[vehicleId], o.[type]
            ORDER BY ml.[serviceDate] DESC, ml.[mileageAtService] DESC
        ) AS [rn]
    FROM [dbo].[MaintenanceOperation] o
    JOIN [dbo].[MaintenanceLog] ml ON ml.[id] = o.[maintenanceLogId]
    WHERE o.[deletedAt] IS NULL AND ml.[deletedAt] IS NULL
)
SELECT
    r.[vehicleId],
    r.[type]             AS [maintenanceType],
    mt.[name]            AS [maintenanceTypeName],
    r.[serviceDate]      AS [lastServiceDate],
    r.[mileageAtService] AS [lastMileage],
    r.[cost]             AS [lastCost],
    r.[maintenanceLogId]
FROM ranked r
JOIN [dbo].[MaintenanceType] mt ON mt.[code] = r.[type]
WHERE r.[rn] = 1
');

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH