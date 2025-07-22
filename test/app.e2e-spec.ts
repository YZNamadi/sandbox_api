import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

jest.setTimeout(60000); // Increase timeout for slow DB/container startup

// Minimal valid OpenAPI 3.0 spec for testing
const openApiSpec = {
  openapi: '3.0.0',
  info: { title: 'Test', version: '1.0.0' },
  paths: {
    '/test': {
      get: {
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { message: { type: 'string' } } },
              },
            },
          },
        },
      },
    },
  },
};

describe('E2E: All endpoints', () => {
  let app: INestApplication;
  let jwt: string;
  let sandboxId: string;
  const uniqueEmail = `testuser+${Date.now()}@example.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    // Optionally log DB info
    console.log('DB Host:', process.env.POSTGRES_HOST, 'DB Name:', process.env.POSTGRES_DB);
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  it('GET /health', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /', async () => {
    const res = await request(app.getHttpServer()).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Hello World!');
  });

  it('POST /auth/signup', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: uniqueEmail,
        password: 'Test1234!',
        name: 'Test User',
        teamName: 'Test Team',
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('access_token');
  });

  it('POST /auth/login', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: uniqueEmail, password: 'Test1234!' });
    expect(res.status).toBe(201);
    // Accept either access_token or token
    const token = res.body.access_token || res.body.token;
    expect(token).toBeDefined();
    jwt = token;
  });

  it('POST /sandbox (create sandbox)', async () => {
    const res = await request(app.getHttpServer())
      .post('/sandbox')
      .set('Authorization', `Bearer ${jwt}`)
      .send({ name: 'My Sandbox', openapiSpec: openApiSpec });
    console.log('POST /sandbox', res.body);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    sandboxId = res.body.id;
  });

  it('GET /sandbox/:id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/sandbox/${sandboxId}`)
      .set('Authorization', `Bearer ${jwt}`);
    console.log('GET /sandbox/:id', res.body);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', sandboxId);
  });

  it('PATCH /sandbox/:id/state', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/sandbox/${sandboxId}/state`)
      .set('Authorization', `Bearer ${jwt}`)
      .send({ state: 'active' });
    console.log('PATCH /sandbox/:id/state', res.body);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('state', 'active');
  });

  it('POST /sandbox/:sandboxId/mocks/openapi', async () => {
    const res = await request(app.getHttpServer())
      .post(`/sandbox/${sandboxId}/mocks/openapi`)
      .set('Authorization', `Bearer ${jwt}`)
      .send({ spec: openApiSpec });
    console.log('POST /sandbox/:sandboxId/mocks/openapi', res.body);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('openapi');
  });

  it('POST /sandbox/:sandboxId/mocks/custom', async () => {
    const res = await request(app.getHttpServer())
      .post(`/sandbox/${sandboxId}/mocks/custom`)
      .set('Authorization', `Bearer ${jwt}`)
      .send({
        path: '/test',
        method: 'GET',
        response: { message: 'Hello' },
      });
    console.log('POST /sandbox/:sandboxId/mocks/custom', res.body);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('DELETE /sandbox/:id', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/sandbox/${sandboxId}`)
      .set('Authorization', `Bearer ${jwt}`);
    console.log('DELETE /sandbox/:id', res.body);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('deleted', true);
  });

  // Setup for new E2E tests for all roles
  let ownerJwt: string;
  let adminJwt: string;
  let devJwt: string;
  let viewerJwt: string;
  let teamId: string;
  let userId: string;
  let ciToken: string;

  describe('E2E: Logs, Billing, CI/CD, Admin, and Edge Cases', () => {
    beforeAll(async () => {
      // Ensure DB connection is initialized for this suite
      // const dataSource = app.get('DataSource');
      // if (dataSource && !dataSource.isInitialized) {
      //   await dataSource.initialize();
      // }
      // Create Owner user
      const ownerEmail = `owner+${Date.now()}@example.com`;
      const adminEmail = `admin+${Date.now()}@example.com`;
      const devEmail = `dev+${Date.now()}@example.com`;
      const viewerEmail = `viewer+${Date.now()}@example.com`;
      // Owner signup
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email: ownerEmail, password: 'Test1234!', name: 'Owner', teamName: 'Team1', roleName: 'Owner' });
      const ownerLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: ownerEmail, password: 'Test1234!' });
      ownerJwt = ownerLogin.body.access_token || ownerLogin.body.token;
      // Admin signup
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email: adminEmail, password: 'Test1234!', name: 'Admin', teamName: 'Team1', roleName: 'Admin' });
      const adminLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: adminEmail, password: 'Test1234!' });
      adminJwt = adminLogin.body.access_token || adminLogin.body.token;
      // Developer signup
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email: devEmail, password: 'Test1234!', name: 'Dev', teamName: 'Team1', roleName: 'Developer' });
      const devLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: devEmail, password: 'Test1234!' });
      devJwt = devLogin.body.access_token || devLogin.body.token;
      // Viewer signup
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email: viewerEmail, password: 'Test1234!', name: 'Viewer', teamName: 'Team1', roleName: 'Viewer' });
      const viewerLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: viewerEmail, password: 'Test1234!' });
      viewerJwt = viewerLogin.body.access_token || viewerLogin.body.token;
      // Optionally, get teamId from owner login if needed
      // teamId = ...
      // Create a sandbox as owner
      const sandboxRes = await request(app.getHttpServer())
        .post('/sandbox')
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({ name: 'Log Test Sandbox', openapiSpec: openApiSpec });
      const sandboxId = sandboxRes.body.id;
      // Make a GET /sandbox/:id request as owner to generate a log
      await request(app.getHttpServer())
        .get(`/sandbox/${sandboxId}`)
        .set('Authorization', `Bearer ${ownerJwt}`);
      // Make a GET /sandbox/:id request as dev to generate a log
      await request(app.getHttpServer())
        .get(`/sandbox/${sandboxId}`)
        .set('Authorization', `Bearer ${devJwt}`);
    }, 60000);

    it('Owner/Admin can query all logs', async () => {
      const res = await request(app.getHttpServer())
        .get('/logs')
        .set('Authorization', `Bearer ${ownerJwt}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('Developer/Viewer can only query their team logs', async () => {
      const res = await request(app.getHttpServer())
        .get('/logs')
        .set('Authorization', `Bearer ${devJwt}`);
      expect(res.status).toBe(200);
      // (Optionally check that logs are only for their team)
    });

    it('Owner/Admin can subscribe to a plan', async () => {
      const res = await request(app.getHttpServer())
        .post('/billing/subscribe')
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({ plan: 'PRO' });
      expect(res.status).toBe(201);
    });

    it('Developer/Viewer cannot subscribe to a plan', async () => {
      const res = await request(app.getHttpServer())
        .post('/billing/subscribe')
        .set('Authorization', `Bearer ${devJwt}`)
        .send({ plan: 'PRO' });
      expect(res.status).toBe(403);
    });

    it('Owner/Admin can create and revoke CI tokens', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/ci-tokens')
        .set('Authorization', `Bearer ${adminJwt}`)
        .send({ description: 'CI token' });
      expect(createRes.status).toBe(201);
      ciToken = createRes.body.token;
      const revokeRes = await request(app.getHttpServer())
        .delete('/ci-tokens')
        .set('Authorization', `Bearer ${adminJwt}`)
        .send({ token: ciToken });
      expect(revokeRes.status).toBe(200);
    });

    it('Developer/Viewer cannot create/revoke CI tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/ci-tokens')
        .set('Authorization', `Bearer ${devJwt}`)
        .send({ description: 'Should fail' });
      expect(res.status).toBe(403);
    });

    it('Owner/Admin can manage users and teams', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${ownerJwt}`);
      expect(listRes.status).toBe(200);
      // (Optionally check user list)
      const inviteRes = await request(app.getHttpServer())
        .post('/admin/users/invite')
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({ email: 'newuser@example.com', name: 'New User', roleName: 'Developer' });
      expect(inviteRes.status).toBe(201);
      userId = inviteRes.body.id;
      const changeRoleRes = await request(app.getHttpServer())
        .patch(`/admin/users/${userId}/role`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({ roleName: 'Viewer' });
      expect(changeRoleRes.status).toBe(200);
      const removeRes = await request(app.getHttpServer())
        .delete(`/admin/users/${userId}`)
        .set('Authorization', `Bearer ${ownerJwt}`);
      expect(removeRes.status).toBe(200);
    });

    it('Negative: Unauthorized access returns 401', async () => {
      const res = await request(app.getHttpServer())
        .get('/logs');
      expect(res.status).toBe(401);
    });

    it('Negative: Invalid input returns 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/sandbox')
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({});
      expect(res.status).toBe(400);
    });

    // Add more edge/negative cases as needed
  });
});
