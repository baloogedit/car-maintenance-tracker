import {INestApplication} from '@nestjs/common';
import {randomUUID} from 'crypto';
import request from 'supertest';
import {App} from 'supertest/types';

import {SYNC_STATE_PURGED_VERSION} from '../src/shared/constants/sync.constants';
import {PrismaService} from '../src/shared/modules/db/prisma.service';
import {API, bearer, login, register} from './utils/auth.helper';
import {createTestApp, deleteTestUser} from './utils/create-test-app';
import {PullBody, PushBody, SessionBody, SyncChangeBody} from './utils/response-types';
import {SEED_USERS, uniqueTestEmail} from './utils/test-users';

const DEVICE = 'e2e-eszkoz-A';

function vehicleData(overrides: Record<string, unknown> = {}) {
  return {make: 'Dacia', model: 'Logan', year: 2015, fuelType: 'LPG', ...overrides};
}

describe('Sync (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;
  const email = uniqueTestEmail('sync');
  let companyId: string | null = null;

  beforeAll(async () => {
    ({app, prisma} = await createTestApp());
    ({accessToken} = await register(app, email));
  });

  afterAll(async () => {
    await deleteTestUser(prisma, email);
    if (companyId) await prisma.company.delete({where: {id: companyId}});
    await app.close();
  });

  async function push(mutations: object[], token = accessToken, clientNow = new Date()) {
    const res = await request(app.getHttpServer())
      .post(`${API}/sync/push`)
      .set(bearer(token))
      .send({deviceId: DEVICE, clientNow, mutations})
      .expect(200);
    return res.body as PushBody;
  }

  async function pull(query: Record<string, string | number> = {}, token = accessToken) {
    const res = await request(app.getHttpServer())
      .get(`${API}/sync/pull`)
      .set(bearer(token))
      .query(query)
      .expect(200);
    return res.body as PullBody;
  }

  function upsert(id: string, data: object, baseVersion: number | null, at = new Date()) {
    return {
      mutationId: randomUUID(),
      entity: 'Vehicle',
      op: 'UPSERT',
      id,
      baseVersion,
      clientUpdatedAt: at,
      data,
    };
  }

  function findVehicle(body: PullBody, id: string): SyncChangeBody | undefined {
    return body.changes.Vehicle.find((c) => c.id === id);
  }

  it('uj jarmu push-sal, majd pull since=0', async () => {
    const id = randomUUID();
    const mutation = upsert(id, vehicleData(), null);
    const pushed = await push([mutation]);

    expect(pushed.results).toHaveLength(1);
    expect(pushed.results[0]).toMatchObject({mutationId: mutation.mutationId, status: 'APPLIED'});
    expect(typeof pushed.results[0].version).toBe('number');

    const pulled = await pull({since: 0});
    expect(pulled.hasMore).toBe(false);
    expect(pulled.resetRequired).toBe(false);
    expect(pulled.cursor).toBeGreaterThanOrEqual(pushed.results[0].version!);
    const change = findVehicle(pulled, id);
    expect(change?.version).toBe(pushed.results[0].version);
    expect(change?.deletedAt).toBeNull();
    expect(change?.data).toMatchObject({
      make: 'Dacia',
      fuelType: 'LPG',
      companyId: null,
      vin: null,
    });

    // a kurzortol ujra: nincs uj valtozas
    const again = await pull({since: pulled.cursor, scope: pulled.scope});
    expect(again.changes.Vehicle).toHaveLength(0);
    expect(again.cursor).toBeGreaterThanOrEqual(pulled.cursor);
  });

  it('ugyanaz a mutationId ujra -> DUPLICATE az eredeti eredmennyel', async () => {
    const mutation = upsert(randomUUID(), vehicleData(), null);
    const first = await push([mutation]);
    const second = await push([mutation]);
    expect(second.results[0]).toMatchObject({
      status: 'DUPLICATE',
      originalStatus: 'APPLIED',
      version: first.results[0].version,
    });
  });

  it('modositas: baseVersion egyezik -> APPLIED; regi baseVersion + regebbi ido -> REJECTED_STALE; ujabb ido -> APPLIED (LWW)', async () => {
    const id = randomUUID();
    const t0 = new Date(Date.now() - 60_000);
    const created = await push([upsert(id, vehicleData(), null, t0)]);
    const v1 = created.results[0].version!;

    const updated = await push([upsert(id, vehicleData({currentMileage: 1000}), v1)]);
    expect(updated.results[0].status).toBe('APPLIED');
    const v2 = updated.results[0].version!;
    expect(v2).toBeGreaterThan(v1);

    // egy masik eszkoz v1-re epitve, de regebbi modositassal
    const stale = await push([upsert(id, vehicleData({currentMileage: 5}), v1, t0)]);
    expect(stale.results[0].status).toBe('REJECTED_STALE');
    expect(stale.results[0].current).toMatchObject({id, version: v2});
    expect(stale.results[0].current?.data).toMatchObject({currentMileage: 1000});

    // ugyanez kesobbi modositassal: nyer
    const newer = await push([
      upsert(id, vehicleData({currentMileage: 2000}), v1, new Date(Date.now() + 1000)),
    ]);
    expect(newer.results[0].status).toBe('APPLIED');
    const row = await prisma.vehicle.findUniqueOrThrow({where: {id}});
    expect(row.currentMileage).toBe(2000);
    expect(row.lastModifiedByDeviceId).toBe(DEVICE);
  });

  it('a jovobe mutato ora nem nyer: a clientUpdatedAt a szerver idejere vagodik', async () => {
    const id = randomUUID();
    const future = new Date(Date.now() + 24 * 3600_000);
    // a kliens oraja is a jovoben jar (clientNow), a korrekcio utan a mostani ido marad
    await push([upsert(id, vehicleData(), null, future)], accessToken, future);
    const row = await prisma.vehicle.findUniqueOrThrow({where: {id}});
    expect(Math.abs(row.clientUpdatedAt.getTime() - Date.now())).toBeLessThan(60_000);
  });

  it('hibas data -> REJECTED_INVALID, a keres tobbi mutationja megy tovabb', async () => {
    const bad = upsert(randomUUID(), {make: 'Opel'}, null);
    const good = upsert(randomUUID(), vehicleData(), null);
    const res = await push([bad, good]);
    expect(res.results[0]).toMatchObject({
      mutationId: bad.mutationId,
      status: 'REJECTED_INVALID',
      error: {code: 'VALIDATION_FAILED'},
    });
    expect(res.results[1]).toMatchObject({mutationId: good.mutationId, status: 'APPLIED'});
  });

  it('foglalt VIN -> REJECTED_INVALID CONFLICT', async () => {
    const vin = `SYN${Date.now()}`.padEnd(17, '0').slice(0, 17);
    await push([upsert(randomUUID(), vehicleData({vin}), null)]);
    const res = await push([upsert(randomUUID(), vehicleData({vin}), null)]);
    expect(res.results[0]).toMatchObject({status: 'REJECTED_INVALID', error: {code: 'CONFLICT'}});
  });

  it('idegen jarmu -> NOT_FOUND; ceges jarmu, amit a tag nem szerkeszthet -> FORBIDDEN', async () => {
    const foreign = await prisma.vehicle.findFirstOrThrow({
      where: {owner: {email: SEED_USERS.otherPrivate}, deletedAt: null},
    });
    const res = await push([upsert(foreign.id, vehicleData(), null)]);
    expect(res.results[0]).toMatchObject({error: {code: 'NOT_FOUND'}});

    const member = await login(app, SEED_USERS.companyMember);
    const companyVehicle = await prisma.vehicle.findFirstOrThrow({
      where: {
        companyId: {not: null},
        deletedAt: null,
        owner: {email: SEED_USERS.companyAdmin},
      },
    });
    const forbidden = await push(
      [{...upsert(companyVehicle.id, vehicleData(), null), op: 'DELETE', data: undefined}],
      member.accessToken,
    );
    expect(forbidden.results[0]).toMatchObject({error: {code: 'FORBIDDEN'}});
    const untouched = await prisma.vehicle.findUniqueOrThrow({where: {id: companyVehicle.id}});
    expect(untouched.deletedAt).toBeNull();
  });

  it('DELETE -> tombstone a pull-ban; torolt jarmu nem tamad fel', async () => {
    const id = randomUUID();
    const created = await push([upsert(id, vehicleData(), null)]);
    const before = await pull({since: 0});

    const deleted = await push([
      {
        mutationId: randomUUID(),
        entity: 'Vehicle',
        op: 'DELETE',
        id,
        baseVersion: created.results[0].version,
        clientUpdatedAt: new Date(),
      },
    ]);
    expect(deleted.results[0].status).toBe('APPLIED');

    const after = await pull({since: before.cursor, scope: before.scope});
    const tombstone = findVehicle(after, id);
    expect(tombstone?.deletedAt).not.toBeNull();
    expect(tombstone?.data).toBeUndefined();

    const revived = await push([upsert(id, vehicleData(), null, new Date(Date.now() + 1000))]);
    expect(revived.results[0].status).toBe('REJECTED_STALE');
    expect(revived.results[0].current?.deletedAt).not.toBeNull();
  });

  it('lapozas: limit=1 -> hasMore, a kurzorral a kovetkezo oldal', async () => {
    const first = await pull({since: 0, limit: 1});
    expect(first.changes.Vehicle).toHaveLength(1);
    expect(first.hasMore).toBe(true);

    const second = await pull({since: first.cursor, limit: 1, scope: first.scope});
    expect(second.changes.Vehicle).toHaveLength(1);
    expect(second.changes.Vehicle[0].version).toBeGreaterThan(first.changes.Vehicle[0].version);
  });

  it('a cegtag pull-ja a ceg jarmuveit hozza, idegen maganjarmuvet nem', async () => {
    const member: SessionBody = await login(app, SEED_USERS.companyMember);
    const pulled = await pull({since: 0, limit: 1000}, member.accessToken);
    const companyVehicle = await prisma.vehicle.findFirstOrThrow({
      where: {companyId: {not: null}, owner: {email: SEED_USERS.companyAdmin}},
    });
    const foreign = await prisma.vehicle.findFirstOrThrow({
      where: {owner: {email: SEED_USERS.otherPrivate}},
    });
    expect(findVehicle(pulled, companyVehicle.id)).toBeDefined();
    expect(findVehicle(pulled, foreign.id)).toBeUndefined();
  });

  it('regi kurzor a tombstone takaritas utan -> 410 SYNC_RESET_REQUIRED', async () => {
    const pulled = await pull({since: 0});
    await prisma.syncState.create({
      data: {key: SYNC_STATE_PURGED_VERSION, value: String(pulled.cursor + 1)},
    });
    try {
      const res = await request(app.getHttpServer())
        .get(`${API}/sync/pull`)
        .set(bearer(accessToken))
        .query({since: pulled.cursor})
        .expect(410);
      expect((res.body as {code: string}).code).toBe('SYNC_RESET_REQUIRED');
    } finally {
      await prisma.syncState.delete({where: {key: SYNC_STATE_PURGED_VERSION}});
    }
  });

  it('hibas keres -> 400 (hianyzo deviceId, 101 mutation)', async () => {
    const server = app.getHttpServer();
    await request(server)
      .post(`${API}/sync/push`)
      .set(bearer(accessToken))
      .send({clientNow: new Date(), mutations: []})
      .expect(400);
    const many = Array.from({length: 101}, () => upsert(randomUUID(), vehicleData(), null));
    await request(server)
      .post(`${API}/sync/push`)
      .set(bearer(accessToken))
      .send({deviceId: DEVICE, clientNow: new Date(), mutations: many})
      .expect(400);
  });

  // utolso, mert a felhasznalo ceges admin lesz
  it('a lathatosagi kor valtozasakor (cegalapitas) resetRequired', async () => {
    const before = await pull({since: 0});
    const created = await request(app.getHttpServer())
      .post(`${API}/companies`)
      .set(bearer(accessToken))
      .send({name: 'E2E Sync Kft.'})
      .expect(201);
    accessToken = (created.body as SessionBody).accessToken;
    companyId = (await prisma.user.findUniqueOrThrow({where: {email}})).companyId;

    const after = await pull({since: before.cursor, scope: before.scope});
    expect(after.resetRequired).toBe(true);
    expect(after.cursor).toBe(0);
    expect(after.scope).not.toBe(before.scope);
  });
});
