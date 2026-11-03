-- Javitas: a nem kotelezo, de egyedi mezok (Vehicle.vin, Company.taxId).
--
-- SQL Serveren a UNIQUE megkotes a NULL-t is ertekkent kezeli, ezert az egesz
-- tablaban csak EGY sor lehetett VIN (illetve adoszam) nelkul: a masodik VIN
-- nelkuli jarmu felvetele 409-et adott. A szurt (WHERE ... IS NOT NULL) egyedi
-- index csak a kitoltott ertekekre ellenoriz egyediseget (ugyanazzal a nevvel).
-- A Prisma a szurt indexet nem tudja leirni (es nem is latja), ezert a semaban
-- ennel a ket mezonel nincs @unique; a megsertest az adatbazis ugyanugy P2002
-- hibaval jelzi, amit a PrismaExceptionFilter 409-re fordit.

BEGIN TRY

BEGIN TRAN;

ALTER TABLE [dbo].[Vehicle] DROP CONSTRAINT [Vehicle_vin_key];
CREATE UNIQUE NONCLUSTERED INDEX [Vehicle_vin_key] ON [dbo].[Vehicle]([vin]) WHERE [vin] IS NOT NULL;

ALTER TABLE [dbo].[Company] DROP CONSTRAINT [Company_taxId_key];
CREATE UNIQUE NONCLUSTERED INDEX [Company_taxId_key] ON [dbo].[Company]([taxId]) WHERE [taxId] IS NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH