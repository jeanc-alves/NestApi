import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { FilesService } from 'src/files/files.service';
import { RabbitMQService } from 'src/rabbittmq/rabbittmq.service';
import { CoursesService } from 'src/courses/courses.service';

describe('ActivitiesController', () => {
  let controller: ActivitiesController;
  let activitiesService: jest.Mocked<Partial<ActivitiesService>>;
  let mockRabbitMQ: any;

  const mockActivity = {
    id: 1,
    name: 'Prova 1',
    courseId: 10,
    peso: 2,
    files: [],
    course: null,
  };

  const mockPaginated = {
    items: [mockActivity],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  };

  beforeEach(async () => {
    activitiesService = {
      findAll: jest.fn().mockResolvedValue([mockActivity]),
      findAllPaginated: jest.fn().mockResolvedValue(mockPaginated as any),
      findOneOrFail: jest.fn().mockResolvedValue(mockActivity),
      create: jest.fn().mockResolvedValue(mockActivity),
    };

    mockRabbitMQ = {
      publish: jest.fn().mockResolvedValue(true),
      initialize: jest.fn().mockResolvedValue(undefined),
      sendMessage: jest.fn().mockResolvedValue(undefined),
      closeConnection: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivitiesController],
      providers: [
        {
          provide: ActivitiesService,
          useValue: activitiesService,
        },
        {
          provide: FilesService,
          useValue: {
            uploadMultipleFiles: jest.fn().mockResolvedValue([]),
            downloadZipFiles: jest.fn(),
          },
        },
        {
          provide: RabbitMQService,
          useValue: mockRabbitMQ,
        },
        {
          provide: CoursesService,
          useValue: {
            findOneOrFail: jest.fn().mockResolvedValue({
              id: 10,
              name: 'Curso 1',
              users: [
                { id: 1, firstName: 'João', lastName: 'Silva', email: 'joao@test.com' },
              ],
            }),
          },
        },
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn() },
        },
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<ActivitiesController>(ActivitiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create activity and publish typed event with messageId to rabbitmq', async () => {
      const result = await controller.create(
        [],
        { name: 'Prova 1', courseId: '10', peso: '2' } as any,
        { user: { sub: 1 } },
      );

      expect(activitiesService.create).toHaveBeenCalledWith({
        name: 'Prova 1',
        courseId: 10,
        peso: 2,
      });

      expect(mockRabbitMQ.publish).toHaveBeenCalledWith(
        RabbitMQService.DEFAULT_QUEUE,
        expect.objectContaining({
          messageId: expect.any(String),
          eventType: 'activity.created',
          data: expect.objectContaining({
            activityId: 1,
            courseName: 'Curso 1',
            students: [{ id: 1, name: 'João Silva', email: 'joao@test.com' }],
          }),
        }),
      );

      expect(result.email_sent_to).toEqual(['joao@test.com']);
    });
  });

  describe('findAll', () => {
    it('should return paginated activities', async () => {
      const result = await controller.findAll({ page: 1, limit: 10 });
      expect(result).toEqual(mockPaginated);
      expect(activitiesService.findAllPaginated).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe('findOne', () => {
    it('should return activity by id', async () => {
      const result = await controller.findOne('1');
      expect(result).toEqual(mockActivity);
      expect(activitiesService.findOneOrFail).toHaveBeenCalledWith(1);
    });
  });
});
