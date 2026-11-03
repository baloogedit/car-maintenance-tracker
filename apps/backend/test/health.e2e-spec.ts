import {INestApplication} from '@nestjs/common';
import request from 'supertest';
import {App} from 'supertest/types';

import {API} from './utils/auth.helper';
import {createTestApp} from './utils/create-test-app';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    ({app} = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health publikus', () => {
    return request(app.getHttpServer()).get(`${API}/health`).expect(200, {status: 'ok'});
  });
});
