process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'this_is_a_very_secure_test_jwt_secret_key_123';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:root@localhost:5432/nest?schema=public';
process.env.RABBITMQ_URL =
  process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('NestApi End-to-End Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let studentToken: string;

  const testEmailAdmin = `admin_${Date.now()}@test.com`;
  const testEmailStudent = `student_${Date.now()}@test.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    if (prisma && prisma.user) {
      await prisma.user.deleteMany({
        where: {
          email: { in: [testEmailAdmin, testEmailStudent] },
        },
      });
    }
    if (app) {
      await app.close();
    }
  });

  describe('Health / Root', () => {
    it('/ (GET)', async () => {
      const response = await request(app.getHttpServer()).get('/');
      expect([200, 304]).toContain(response.status);
    });
  });

  describe('Auth Module (E2E)', () => {
    it('POST /auth/register should create an admin user and omit password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          firstName: 'Admin',
          email: testEmailAdmin,
          password: 'supersecretpassword123',
          profile: 'ADMIN',
        })
        .expect(201);

      expect(response.body.email).toBe(testEmailAdmin);
      expect(response.body.password).toBeUndefined();
    });

    it('POST /auth/register should create a student user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          firstName: 'Student',
          email: testEmailStudent,
          password: 'studentpassword123',
          profile: 'ALUNO',
        })
        .expect(201);

      expect(response.body.email).toBe(testEmailStudent);
      expect(response.body.password).toBeUndefined();
    });

    it('POST /auth/register should fail with 409 Conflict on duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          firstName: 'Duplicate',
          email: testEmailAdmin,
          password: 'supersecretpassword123',
        })
        .expect(409);
    });

    it('POST /auth/login should return JWT access_token and user without password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmailAdmin,
          password: 'supersecretpassword123',
        })
        .expect(200);

      expect(response.body.access_token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.password).toBeUndefined();
      adminToken = response.body.access_token;
    });

    it('POST /auth/login should authenticate student and obtain token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmailStudent,
          password: 'studentpassword123',
        })
        .expect(200);

      expect(response.body.access_token).toBeDefined();
      studentToken = response.body.access_token;
    });

    it('POST /auth/login should return 401 Unauthorized with invalid password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmailAdmin,
          password: 'wrong_password',
        })
        .expect(401);
    });
  });

  describe('Authorization & Resource Protection (E2E)', () => {
    it('GET /courses should return 401 Unauthorized without token', async () => {
      await request(app.getHttpServer()).get('/courses').expect(401);
    });

    it('GET /courses should return 200 with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /courses should return 403 Forbidden for non-admin student', async () => {
      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Hacked Course',
          sector: 'Unauthorized',
          duration: 10,
        })
        .expect(403);
    });

    it('POST /courses should return 201 Created for authenticated ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Engenharia de Software',
          sector: 'Tecnologia',
          duration: 360,
        })
        .expect(201);

      expect(response.body.name).toBe('Engenharia de Software');
      expect(response.body.id).toBeDefined();
    });

    it('GET /courses/:id should return 404 Not Found for non-existent course', async () => {
      const response = await request(app.getHttpServer())
        .get('/courses/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.statusCode).toBe(404);
      expect(response.body.message).toContain('Course not found');
    });
  });
});
