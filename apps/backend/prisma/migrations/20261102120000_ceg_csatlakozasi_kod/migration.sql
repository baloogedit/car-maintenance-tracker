-- Company.joinCode: csatlakozasi kod, amivel egy maganszemely tagkent belep a cegbe.
--
-- A meglevo cegek veletlen 10 karakteres kodot kapnak. Az uj cegeknel a kodot a
-- Prisma kliens (nanoid) vagy a backend (generateJoinCode) adja, ezert az
-- oszlopnak nincs adatbazis-szintu DEFAULT erteke.
-- Az UPDATE EXEC-ben fut, mert az SQL Server az egesz batchet elore leforditja,
-- es az ALTER TABLE elott meg nem letezo oszlopot nem ismerne.

BEGIN TRY

BEGIN TRAN;

ALTER TABLE [dbo].[Company] ADD [joinCode] NVARCHAR(16) NULL;

EXEC('UPDATE [dbo].[Company] SET [joinCode] = LEFT(REPLACE(CONVERT(NVARCHAR(36), NEWID()), ''-'', ''''), 10)');

ALTER TABLE [dbo].[Company] ALTER COLUMN [joinCode] NVARCHAR(16) NOT NULL;

ALTER TABLE [dbo].[Company] ADD CONSTRAINT [Company_joinCode_key] UNIQUE NONCLUSTERED ([joinCode]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH