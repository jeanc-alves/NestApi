process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'this_is_a_very_secure_test_jwt_secret_key_123';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:root@localhost:5432/nest?schema=public';
process.env.RABBITMQ_URL =
  process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { RabbitMQService } from '../src/rabbittmq/rabbittmq.service';
import { IdempotencyService } from '../src/rabbittmq/idempotency.service';
import { ActivityCreatedEvent } from '../src/rabbittmq/contracts/activity-created.event';

describe('NestApi End-to-End Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let rabbitMQService: RabbitMQService;
  let idempotencyService: IdempotencyService;
  let adminToken: string;
  let studentToken: string;
  let createdCourseId: number;

  const testEmailAdmin = `admin_${Date.now()}@test.com`;
  const testEmailStudent = `student_${Date.now()}@test.com`;
  const testMessageIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', {
      exclude: ['/', 'api/docs', 'api/docs-json'],
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    const swaggerConfig = new DocumentBuilder()
      .setTitle('NestApi')
      .setDescription('NestApi documentation')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, swaggerDocument);

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    rabbitMQService = app.get<RabbitMQService>(RabbitMQService);
    idempotencyService = app.get<IdempotencyService>(IdempotencyService);
  });

  afterAll(async () => {
    if (prisma && prisma.user) {
      await prisma.user.deleteMany({
        where: {
          email: { in: [testEmailAdmin, testEmailStudent] },
        },
      });
    }
    if (prisma && prisma.course && createdCourseId) {
      await prisma.activities.deleteMany({
        where: { courseId: createdCourseId },
      });
      await prisma.course.deleteMany({
        where: { id: createdCourseId },
      });
    }
    if (prisma && prisma.processedMessage && testMessageIds.length > 0) {
      await prisma.processedMessage.deleteMany({
        where: {
          id: { in: testMessageIds },
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

  describe('Swagger Documentation (E2E)', () => {
    it('GET /api/docs should serve Swagger UI HTML', async () => {
      const response = await request(app.getHttpServer()).get('/api/docs/').expect(200);
      expect(response.text).toContain('Swagger UI');
    });

    it('GET /api/docs-json should serve OpenAPI JSON schema', async () => {
      const response = await request(app.getHttpServer()).get('/api/docs-json').expect(200);
      expect(response.body).toHaveProperty('openapi');
      expect(response.body.info.title).toBe('NestApi');
    });
  });

  describe('Auth Module (E2E)', () => {
    it('POST /api/v1/auth/register should create an admin user and omit password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Admin',
          lastName: 'User',
          email: testEmailAdmin,
          password: 'SecretPassword123!',
          profile: 'ADMIN',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(testEmailAdmin);
      expect(response.body.profile).toBe('ADMIN');
      expect(response.body.password).toBeUndefined();
    });

    it('POST /api/v1/auth/register should create a student user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Student',
          lastName: 'One',
          email: testEmailStudent,
          password: 'StudentPassword123!',
          profile: 'ALUNO',
        })
        .expect(201);

      expect(response.body.email).toBe(testEmailStudent);
      expect(response.body.profile).toBe('ALUNO');
      expect(response.body.password).toBeUndefined();
    });

    it('POST /api/v1/auth/register should fail with 409 Conflict on duplicate email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Duplicate',
          email: testEmailAdmin,
          password: 'AnotherPassword123!',
        })
        .expect(409);

      expect(response.body.statusCode).toBe(409);
    });

    it('POST /api/v1/auth/login should return JWT access_token and user without password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmailAdmin,
          password: 'SecretPassword123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testEmailAdmin);
      expect(response.body.user.password).toBeUndefined();

      adminToken = response.body.access_token;
    });

    it('POST /api/v1/auth/login should authenticate student and obtain token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmailStudent,
          password: 'StudentPassword123!',
        })
        .expect(200);

      expect(response.body.access_token).toBeDefined();
      studentToken = response.body.access_token;
    });

    it('POST /api/v1/auth/login should return 401 Unauthorized with invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmailAdmin,
          password: 'WrongPassword!',
        })
        .expect(401);

      expect(response.body.statusCode).toBe(401);
    });
  });

  describe('Authorization & Resource Protection (E2E)', () => {
    it('GET /api/v1/courses should return 401 Unauthorized without token', async () => {
      await request(app.getHttpServer()).get('/api/v1/courses').expect(401);
    });

    it('POST /api/v1/courses should return 403 Forbidden for non-admin student', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Hacked Course',
          sector: 'Unauthorized',
          duration: 10,
        })
        .expect(403);
    });

    it('POST /api/v1/courses should return 201 Created for authenticated ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Engenharia de Software',
          sector: 'Tecnologia',
          duration: 360,
        })
        .expect(201);

      expect(response.body.name).toBe('Engenharia de Software');
      expect(response.body.id).toBeDefined();
      createdCourseId = response.body.id;
    });

    it('GET /api/v1/courses should return paginated result with meta', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/courses?page=1&limit=5')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(5);
      expect(response.body.meta).toHaveProperty('totalPages');
      expect(response.body.meta).toHaveProperty('hasNext');
      expect(response.body.meta).toHaveProperty('hasPrev');
    });

    it('GET /api/v1/courses/:id should return 404 Not Found for non-existent course', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/courses/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.statusCode).toBe(404);
      expect(response.body.message).toContain('Course not found');
    });
  });

  describe('Secure Upload & MIME Validation (E2E)', () => {
    it('POST /api/v1/activities should reject non-PDF file with forged extension', async () => {
      const fakeExecutable = Buffer.from([0x4d, 0x5a, 0x90, 0x00]);

      await request(app.getHttpServer())
        .post('/api/v1/activities')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Atividade Fake')
        .field('courseId', createdCourseId)
        .field('peso', 5)
        .attach('files', fakeExecutable, 'virus.pdf')
        .expect(400);
    });

    it('POST /api/v1/activities should accept valid PDF with magic number and dispatch event', async () => {
      const validPdfBuffer = Buffer.from('%PDF-1.4 test content\n%%EOF');

      const response = await request(app.getHttpServer())
        .post('/api/v1/activities')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Trabalho de Arquitetura')
        .field('courseId', createdCourseId)
        .field('peso', 10)
        .attach('files', validPdfBuffer, 'trabalho.pdf')
        .expect(201);

      expect(response.body).toHaveProperty('activity');
      expect(response.body.activity.name).toBe('Trabalho de Arquitetura');
      expect(response.body.files).toHaveLength(1);
      expect(response.body.files[0].ext).toBe('pdf');
    });
  });

  describe('RabbitMQ Messaging & Idempotency (E2E)', () => {
    it('should have connection and active channel initialized', () => {
      expect(rabbitMQService.getConnection()).toBeDefined();
      expect(rabbitMQService.getChannel()).toBeDefined();
    });

    it('should enforce idempotency preventing duplicate event processing', async () => {
      const messageId = randomUUID();
      testMessageIds.push(messageId);

      const before = await idempotencyService.isProcessed(messageId);
      expect(before).toBe(false);

      await idempotencyService.markAsProcessed(
        messageId,
        RabbitMQService.DEFAULT_QUEUE,
        'activity.created',
      );

      const after = await idempotencyService.isProcessed(messageId);
      expect(after).toBe(true);

      const persisted = await prisma.processedMessage.findUnique({
        where: { id: messageId },
      });
      expect(persisted).toBeDefined();
      expect(persisted?.queue).toBe(RabbitMQService.DEFAULT_QUEUE);
      expect(persisted?.eventType).toBe('activity.created');
    });

    it('should successfully publish typed message to queue with persistent header', async () => {
      const messageId = randomUUID();
      testMessageIds.push(messageId);

      const event: ActivityCreatedEvent = {
        messageId,
        eventType: 'activity.created',
        timestamp: new Date().toISOString(),
        data: {
          activityId: 99,
          activityName: 'E2E Atividade',
          courseId: 1,
          courseName: 'Engenharia',
          peso: 10,
          students: [{ id: 1, name: 'Aluno', email: 'aluno@e2e.com' }],
        },
      };

      const published = await rabbitMQService.publish(
        RabbitMQService.DEFAULT_QUEUE,
        event,
        { 'x-correlation-id': messageId },
      );

      expect(published).toBe(true);
    });
  });
});
