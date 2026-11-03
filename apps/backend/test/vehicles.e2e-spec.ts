import {INestApplication} from '@nestjs/common';
import {randomUUID} from 'crypto';
import request from 'supertest';
import {App} from 'supertest/types';

import {PrismaService} from '../src/shared/modules/db/prisma.service';
import {API, bearer, login, register} from './utils/auth.helper';
import {createTestApp, deleteTestUser} from './utils/create-test-app';
import {VehicleBody} from './utils/response-types';
import {SEED_USERS, uniqueTestEmail} from './utils/test-users';

describe('Vehicles (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;
  const email = uniqueTestEmail('vehicles');

  beforeAll(async () => {
    ({app, prisma} = await createTestApp());
    ({accessToken} = await register(app, email));
  });

  afterAll(async () => {
    await deleteTestUser(prisma, email);
    await app.close();
  });

  it('CRUD a sajat jarmuvon, soft delete', async () => {
    const auth = bearer(accessToken);
    const id = randomUUID();

    const created = await request(app.getHttpServer())
      .post(`${API}/vehicles`)
      .set(auth)
      .send({id, make: 'Dacia', model: 'Logan', year: 2015, fuelType: 'LPG'})
      .expect(201);
    const vehicle = created.body as VehicleBody;
    expect(vehicle.id).toBe(id);
    expect(vehicle.companyId).toBeNull();

    const list = await request(app.getHttpServer()).get(`${API}/vehicles`).set(auth).expect(200);
    expect(list.body as VehicleBody[]).toHaveLength(1);

    const patched = await request(app.getHttpServer())
      .patch(`${API}/vehicles/${id}`)
      .set(auth)
      .send({currentMileage: 123000, ownerUserId: 'nem-modosithato'})
      .expect(200);
    expect((patched.body as VehicleBody).currentMileage).toBe(123000);
    expect((patched.body as VehicleBody).ownerUserId).toBe(vehicle.ownerUserId);

    await request(app.getHttpServer()).delete(`${API}/vehicles/${id}`).set(auth).expect(204);
    await request(app.getHttpServer()).get(`${API}/vehicles/${id}`).set(auth).expect(404);

    // a sor megmaradt, csak tombstone lett
    const row = await prisma.vehicle.findUnique({where: {id}});
    expect(row?.deletedAt).not.toBeNull();
  });

  it('tobb VIN nelkuli jarmu is lehet, de ket egyforma VIN -> 409', async () => {
    const auth = bearer(accessToken);
    const vin = `E2E${Date.now()}`.padEnd(17, '0').slice(0, 17);
    for (const body of [
      {make: 'Skoda', model: 'Fabia', year: 2010},
      {make: 'Skoda', model: 'Octavia', year: 2011},
      {make: 'Skoda', model: 'Superb', year: 2012, vin},
    ]) {
      await request(app.getHttpServer()).post(`${API}/vehicles`).set(auth).send(body).expect(201);
    }
    await request(app.getHttpServer())
      .post(`${API}/vehicles`)
      .set(auth)
      .send({make: 'Skoda', model: 'Kodiaq', year: 2020, vin})
      .expect(409);
  });

  it('idegen es hibas id -> 404', async () => {
    const foreign = await prisma.vehicle.findFirstOrThrow({
      where: {owner: {email: SEED_USERS.otherPrivate}},
    });
    await request(app.getHttpServer())
      .get(`${API}/vehicles/${foreign.id}`)
      .set(bearer(accessToken))
      .expect(404);
    await request(app.getHttpServer())
      .get(`${API}/vehicles/nem-uuid`)
      .set(bearer(accessToken))
      .expect(404);
  });

  it('cegtag latja a ceg jarmuveit, de mas jarmuvet nem modosithat', async () => {
    const member = await login(app, SEED_USERS.companyMember);
    const adminVehicle = await prisma.vehicle.findFirstOrThrow({
      where: {owner: {email: SEED_USERS.companyAdmin}, deletedAt: null},
    });
    const auth = bearer(member.accessToken);

    const list = await request(app.getHttpServer()).get(`${API}/vehicles`).set(auth).expect(200);
    expect((list.body as VehicleBody[]).map((v) => v.id)).toContain(adminVehicle.id);

    await request(app.getHttpServer())
      .patch(`${API}/vehicles/${adminVehicle.id}`)
      .set(auth)
      .send({currentMileage: 1})
      .expect(403);
    await request(app.getHttpServer())
      .delete(`${API}/vehicles/${adminVehicle.id}`)
      .set(auth)
      .expect(403);
  });
});
