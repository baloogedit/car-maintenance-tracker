import {INestApplication} from '@nestjs/common';
import request from 'supertest';
import {App} from 'supertest/types';

import {PrismaService} from '../src/shared/modules/db/prisma.service';
import {API, bearer, login, register} from './utils/auth.helper';
import {createTestApp, deleteTestUser} from './utils/create-test-app';
import {CompanyBody, MemberBody, SessionBody, VehicleBody} from './utils/response-types';
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

    // a regi (meg PRIVATE-ot mutato) tokennel sem lehet ujra csatlakozni: a
    // JwtGuard a szerepkort az adatbazisbol veszi, ott mar COMPANY_MEMBER
    await request(app.getHttpServer())
      .post(`${API}/companies/join`)
      .set(bearer(accessToken))
      .send({joinCode: code})
      .expect(403);

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

  describe('tagsag: jarmuvek, taglista, szerepkor, eltavolitas, kilepes', () => {
    let member: SessionBody;
    let companyVehicleId: string;
    let privateVehicleId: string;
    const http = () => request(app.getHttpServer());

    beforeAll(async () => {
      member = await login(app, memberEmail);
    });

    it('a tag ceges es maganjarmuvet is felvehet; a maganjarmuvet az admin nem latja', async () => {
      const company = await http()
        .post(`${API}/vehicles`)
        .set(bearer(member.accessToken))
        .send({make: 'Ford', model: 'Transit', year: 2020})
        .expect(201);
      companyVehicleId = (company.body as VehicleBody).id;
      expect((company.body as VehicleBody).companyId).toBe(companyId);

      const own = await http()
        .post(`${API}/vehicles`)
        .set(bearer(member.accessToken))
        .send({make: 'Opel', model: 'Astra', year: 2012, isCompanyVehicle: false})
        .expect(201);
      privateVehicleId = (own.body as VehicleBody).id;
      expect((own.body as VehicleBody).companyId).toBeNull();

      const list = await http().get(`${API}/vehicles`).set(bearer(admin.accessToken)).expect(200);
      const ids = (list.body as VehicleBody[]).map((v) => v.id);
      expect(ids).toContain(companyVehicleId);
      expect(ids).not.toContain(privateVehicleId);
    });

    it('az admin latja a taglistat, a tag nem', async () => {
      const res = await http()
        .get(`${API}/companies/me/members`)
        .set(bearer(admin.accessToken))
        .expect(200);
      expect((res.body as MemberBody[]).map((m) => m.role).sort()).toEqual([
        'COMPANY_ADMIN',
        'COMPANY_MEMBER',
      ]);
      await http().get(`${API}/companies/me/members`).set(bearer(member.accessToken)).expect(403);
    });

    it('az egyetlen admin nem lephet ki es nem fokozhatja le magat -> 409', async () => {
      await http().post(`${API}/companies/me/leave`).set(bearer(admin.accessToken)).expect(409);
      await http()
        .patch(`${API}/companies/me/members/${admin.user.id}`)
        .set(bearer(admin.accessToken))
        .send({role: 'COMPANY_MEMBER'})
        .expect(409);
    });

    it('szerepkorvaltas azonnal ervenyes, a regi tokennel is', async () => {
      await http()
        .patch(`${API}/companies/me/members/${member.user.id}`)
        .set(bearer(admin.accessToken))
        .send({role: 'COMPANY_ADMIN'})
        .expect(200);
      // a token meg COMPANY_MEMBER-t mutat, de a JwtGuard az adatbazisbol olvas
      await http().get(`${API}/companies/me/members`).set(bearer(member.accessToken)).expect(200);
      await http()
        .patch(`${API}/companies/me/members/${member.user.id}`)
        .set(bearer(admin.accessToken))
        .send({role: 'COMPANY_MEMBER'})
        .expect(200);
      await http()
        .patch(`${API}/companies/me/members/${member.user.id}`)
        .set(bearer(admin.accessToken))
        .send({role: 'PRIVATE'})
        .expect(400);
    });

    it('eltavolitas: a ceges jarmu az adminhoz kerul, a maganjarmu marad, azonnal kizarva', async () => {
      await http()
        .delete(`${API}/companies/me/members/${member.user.id}`)
        .set(bearer(admin.accessToken))
        .expect(204);

      const company = await prisma.vehicle.findUniqueOrThrow({where: {id: companyVehicleId}});
      expect(company.ownerUserId).toBe(admin.user.id);
      const own = await prisma.vehicle.findUniqueOrThrow({where: {id: privateVehicleId}});
      expect(own.ownerUserId).toBe(member.user.id);

      // a meg ervenyes access tokennel sem lat semmit a cegbol
      await http().get(`${API}/companies/me`).set(bearer(member.accessToken)).expect(403);
      const list = await http().get(`${API}/vehicles`).set(bearer(member.accessToken)).expect(200);
      expect((list.body as VehicleBody[]).map((v) => v.id)).toEqual([privateVehicleId]);

      // minden refresh tokenje visszavonva
      await http()
        .post(`${API}/auth/refresh`)
        .send({refreshToken: member.refreshToken})
        .expect(401);
    });

    it('kilepes: ujra csatlakozik, majd kilep -> maganszemely, uj tokent kap', async () => {
      const code = (
        (await http().get(`${API}/companies/me`).set(bearer(admin.accessToken)).expect(200))
          .body as CompanyBody
      ).joinCode!;
      const fresh = await login(app, memberEmail);
      await http()
        .post(`${API}/companies/join`)
        .set(bearer(fresh.accessToken))
        .send({joinCode: code})
        .expect(200);

      const res = await http()
        .post(`${API}/companies/me/leave`)
        .set(bearer(fresh.accessToken))
        .expect(200);
      expect((res.body as SessionBody).user.role).toBe('PRIVATE');
    });
  });
});
