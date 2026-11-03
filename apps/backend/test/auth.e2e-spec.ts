import {INestApplication} from '@nestjs/common';
import request from 'supertest';
import {App} from 'supertest/types';

import {PrismaService} from '../src/shared/modules/db/prisma.service';
import {API, bearer, login, register} from './utils/auth.helper';
import {createTestApp, deleteTestUser} from './utils/create-test-app';
import {SessionBody} from './utils/response-types';
import {TEST_PASSWORD, uniqueTestEmail} from './utils/test-users';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const email = uniqueTestEmail('auth');

  beforeAll(async () => {
    ({app, prisma} = await createTestApp());
    await register(app, email);
  });

  afterAll(async () => {
    await deleteTestUser(prisma, email);
    await app.close();
  });

  it('regisztracio utan PRIVATE szerepkor, a /me mukodik', async () => {
    const session = await login(app, email);
    expect(session.user.role).toBe('PRIVATE');
    await request(app.getHttpServer())
      .get(`${API}/auth/me`)
      .set(bearer(session.accessToken))
      .expect(200);
  });

  it('foglalt e-mail -> 409', () => {
    return request(app.getHttpServer())
      .post(`${API}/auth/register`)
      .send({email, password: TEST_PASSWORD, firstName: 'Teszt'})
      .expect(409);
  });

  it('hibas jelszo 401, token nelkul 401, ervenytelen body 400', async () => {
    await request(app.getHttpServer())
      .post(`${API}/auth/login`)
      .send({email, password: 'rossz-jelszo'})
      .expect(401);
    await request(app.getHttpServer()).get(`${API}/vehicles`).expect(401);
    await request(app.getHttpServer())
      .post(`${API}/auth/register`)
      .send({email: 'nem-email', password: 'rovid'})
      .expect(400);
  });

  it('refresh rotacio es ujrafelhasznalas eszlelese', async () => {
    const first = await login(app, email);
    const rotated = await request(app.getHttpServer())
      .post(`${API}/auth/refresh`)
      .send({refreshToken: first.refreshToken})
      .expect(200);
    const rotatedToken = (rotated.body as SessionBody).refreshToken;
    expect(rotatedToken).not.toBe(first.refreshToken);

    // a regi token ujrakuldese -> 401, es az uj token is visszavonodik
    await request(app.getHttpServer())
      .post(`${API}/auth/refresh`)
      .send({refreshToken: first.refreshToken})
      .expect(401);
    await request(app.getHttpServer())
      .post(`${API}/auth/refresh`)
      .send({refreshToken: rotatedToken})
      .expect(401);
  });

  it('kijelentkezes utan a refresh token nem hasznalhato', async () => {
    const session = await login(app, email);
    await request(app.getHttpServer())
      .post(`${API}/auth/logout`)
      .send({refreshToken: session.refreshToken})
      .expect(204);
    await request(app.getHttpServer())
      .post(`${API}/auth/refresh`)
      .send({refreshToken: session.refreshToken})
      .expect(401);
  });
});