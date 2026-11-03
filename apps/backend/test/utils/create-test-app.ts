import {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {App} from 'supertest/types';

import {AppModule} from '../../src/app.module';
import {configureApp} from '../../src/shared/bootstrap/configure-app';
import {PrismaService} from '../../src/shared/modules/db/prisma.service';

// Ugyanaz az alkalmazas, mint ami a main.ts-ben indul (configureApp), csak
// HTTP port nelkul: a supertest kozvetlenul a szerver objektumot hivja.
export async function createTestApp(): Promise<{
  app: INestApplication<App>;
  prisma: PrismaService;
}> {
  const moduleFixture = await Test.createTestingModule({imports: [AppModule]}).compile();
  const app = moduleFixture.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();
  return {app, prisma: app.get(PrismaService)};
}

// A teszt altal regisztralt felhasznalo es jarmuvei torlese (fizikailag).
export async function deleteTestUser(prisma: PrismaService, email: string): Promise<void> {
  const user = await prisma.user.findUnique({where: {email}});
  if (!user) return;
  await prisma.vehicle.deleteMany({where: {ownerUserId: user.id}});
  await prisma.user.delete({where: {id: user.id}});
}
