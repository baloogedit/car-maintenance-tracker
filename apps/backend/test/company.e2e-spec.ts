import {INestApplication} from '@nestjs/common';
import request from 'supertest';
import {App} from 'supertest/types';

import {PrismaService} from '../src/shared/modules/db/prisma.service';
import {API, bearer, login, register} from './utils/auth.helper';
import {createTestApp, deleteTestUser} from './utils/create-test-app';
import {CompanyBody, SessionBody} from './utils/response-types';
import {SEED_USERS, uniqueTestEmail} from './utils/test-users';

describe('Companies (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const adminEmail = uniqueTestEmail('ceg-admin');
  const memberEmail = uniqueTestEmail('ceg-tag');
  let admin: SessionBody;
  let companyId: string | null = null;

  beforeAll(async () => {
    ({app, prisma} = await createTestApp());
    await register(app, adminEmail);
    await register(app, memberEmail);
  });

  afterAll(async () => {
    await deleteTestUser(prisma, adminEmail);
    await deleteTestUser(prisma, memberEmail);
    if (companyId) await prisma.company.delete({where: {id: companyId}});
    await app.close();
  });

  it('maganszemely letrehoz egy ceget -> admin lesz, uj tokent kap', async () => {
    const {accessToken} = await login(app, adminEmail);
    const res = await request(app.getHttpServer())
      .post(`${API}/companies`)
      .set(bearer(accessToken))
      .send({name: 'E2E Teszt Kft.'})
      .expect(201);
    admin = res.body as SessionBody;
    expect(admin.user.role).toBe('COMPANY_ADMIN');

    const me = await request(app.getHttpServer())
      .get(`${API}/companies/me`)
      .set(bearer(admin.accessToken))
      .expect(200);
    const company = me.body as CompanyBody;
    companyId = company.id;
    expect(company.joinCode).toMatch(/^[A-Z2-9]{8}$/);
  });

  it('admin nem hozhat letre masodik ceget -> 403', () => {
    return request(app.getHttpServer())
      .post(`${API}/companies`)
      .set(bearer(admin.accessToken))
      .send({name: 'Masodik Kft.'})
      .expect(403);
  });

  it('ervenytelen kod -> 404, ures kod -> 400', async () => {
    const {accessToken} = await login(app, memberEmail);
    await request(app.getHttpServer())
      .post(`${API}/companies/join`)
      .set(bearer(accessToken))
      .send({joinCode: 'NINCSILYEN'})
      .expect(404);
    await request(app.getHttpServer())
      .post(`${API}/companies/join`)
      .set(bearer(accessToken))
      .send({joinCode: '  '})
      .expect(400);
  });

  it('csatlakozas koddal (kisbetuvel, szokozzel is) -> tag lesz, a kodot nem latja', async () => {
    const me = await request(app.getHttpServer())
      .get(`${API}/companies/me`)
      .set(bearer(admin.accessToken))
      .expect(200);
    const code = (me.body as CompanyBody).joinCode!;

    const {accessToken} = await login(app, memberEmail);
    const res = await request(app.getHttpServer())
      .post(`${API}/companies/join`)
      .set(bearer(accessToken))
      .send({joinCode: ` ${code.toLowerCase()} `})
      .expect(200);
    const member = res.body as SessionBody;
    expect(member.user.role).toBe('COMPANY_MEMBER');

    const company = await request(app.getHttpServer())
      .get(`${API}/companies/me`)
      .set(bearer(member.accessToken))
      .expect(200);
    expect((company.body as CompanyBody).joinCode).toBeNull();

    // a regi (meg PRIVATE) tokennel sem lehet ujra csatlakozni
    await request(app.getHttpServer())
      .post(`${API}/companies/join`)
      .set(bearer(accessToken))
      .send({joinCode: code})
      .expect(409);

    // a tag nem generalhat uj kodot
    await request(app.getHttpServer())
      .post(`${API}/companies/me/join-code`)
      .set(bearer(member.accessToken))
      .expect(403);
  });

  it('uj kod generalasa utan a regi kod ervenytelen', async () => {
    const before = await request(app.getHttpServer())
      .get(`${API}/companies/me`)
      .set(bearer(admin.accessToken))
      .expect(200);
    const oldCode = (before.body as CompanyBody).joinCode!;

    const res = await request(app.getHttpServer())
      .post(`${API}/companies/me/join-code`)
      .set(bearer(admin.accessToken))
      .expect(200);
    expect((res.body as {joinCode: string}).joinCode).not.toBe(oldCode);

    const {accessToken} = await login(app, SEED_USERS.otherPrivate);
    await request(app.getHttpServer())
      .post(`${API}/companies/join`)
      .set(bearer(accessToken))
      .send({joinCode: oldCode})
      .expect(404);
  });

  it('maganszemely nem kerheti le a ceget -> 403', async () => {
    const {accessToken} = await login(app, SEED_USERS.private);
    await request(app.getHttpServer())
      .get(`${API}/companies/me`)
      .set(bearer(accessToken))
      .expect(403);
  });
});
