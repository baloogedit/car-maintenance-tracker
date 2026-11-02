// Az SQL Server Prisma-konnektor nem ismeri az enumot, ezert az engedelyezett
// ertekeket itt, TypeScript oldalon tartjuk (lasd schema.prisma eleje).
export enum UserRole {
  PRIVATE = 'PRIVATE',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  COMPANY_MEMBER = 'COMPANY_MEMBER',
}
