import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Auth & Roles (e2e)', () => {
  let app: INestApplication<App>;
  const uniqueEmail = `e2e-${Date.now()}@example.com`;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a new user', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: uniqueEmail, password: 'password123', name: 'E2E Test User' })
      .expect(201);
  });

  it('rejects duplicate registration', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: uniqueEmail, password: 'password123', name: 'E2E Test User' })
      .expect(409);
  });

  it('logs in and returns a token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: uniqueEmail, password: 'password123' })
      .expect(201);

    expect(res.body.access_token).toBeDefined();
    token = res.body.access_token;
  });

  it('rejects login with wrong password', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: uniqueEmail, password: 'wrongpassword' })
      .expect(401);
  });

  it('blocks a protected route with no token', () => {
    return request(app.getHttpServer()).get('/users/me').expect(401);
  });

  it('allows a protected route with a valid token', () => {
    return request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('blocks a role-gated route for a non-ADMIN user', () => {
    return request(app.getHttpServer())
      .post('/teams')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `e2e-team-${Date.now()}` })
      .expect(403);
  });
});