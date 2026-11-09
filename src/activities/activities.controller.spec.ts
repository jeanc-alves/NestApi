import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { FilesService } from 'src/files/files.service';
import { RabbitMQService } from 'src/rabbittmq/rabbittmq.service';
import { EmailService } from 'src/email/email.service';
import { CoursesService } from 'src/courses/courses.service';

describe('ActivitiesController', () => {
  let controller: ActivitiesController;
  let activitiesService: jest.Mocked<Partial<ActivitiesService>>;

  const mockActivity = {
    id: 1,
    name: 'Prova 1',
    courseId: 10,
    peso: 2,
    files: [],
    course: null,
  };

  beforeEach(async () => {
    activitiesService = {
      findAll: jest.fn().mockResolvedValue([mockActivity]),
      findOneOrFail: jest.fn().mockResolvedValue(mockActivity),
      create: jest.fn().mockResolvedValue(mockActivity),
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
          useValue: {
            initialize: jest.fn().mockResolvedValue(undefined),
            sendMessage: jest.fn().mockResolvedValue(undefined),
            closeConnection: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendMail: jest.fn().mockResolvedValue({ messageId: '123' }),
          },
        },
        {
          provide: CoursesService,
          useValue: {
            findOneOrFail: jest.fn().mockResolvedValue({
              id: 10,
              name: 'Curso 1',
              users: [],
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

  describe('findAll', () => {
    it('should return all activities', async () => {
      const result = await controller.findAll();
      expect(result).toEqual([mockActivity]);
      expect(activitiesService.findAll).toHaveBeenCalled();
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
