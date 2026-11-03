import {INestApplication} from '@nestjs/common';
import request from 'supertest';
import {App} from 'supertest/types';

import {SessionBody} from './response-types';
import {TEST_PASSWORD} from './test-users';

export const API = '/api/v1';

export async function login(app: INestApplication<App>, email: string): Promise<SessionBody> {
  const res = await request(app.getHttpServer())
    .post(`${API}/auth/login`)
    .send({email, password: TEST_PASSWORD})
    .expect(200);
  return res.body as SessionBody;
}

export async function register(app: INestApplication<App>, email: string): Promise<SessionBody> {
  const res = await request(app.getHttpServer())
    .post(`${API}/auth/register`)
    .send({email, password: TEST_PASSWORD, firstName: 'Teszt'})
    .expect(201);
  return res.body as SessionBody;
}

export function bearer(accessToken: string): {Authorization: string} {
  return {Authorization: `Bearer ${accessToken}`};
}
