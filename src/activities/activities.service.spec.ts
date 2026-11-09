import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { PrismaService } from 'src/database/prisma.service';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let prisma: jest.Mocked<Partial<PrismaService>>;

  const mockActivity = {
    id: 1,
    name: 'Exercicio Pratico NestJS',
    courseId: 10,
    peso: 2,
    files: [],
    course: null,
  };

  beforeEach(async () => {
    prisma = {
      activities: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
  });

  describe('create', () => {
    it('should create and return an activity', async () => {
      (prisma.activities.create as jest.Mock).mockResolvedValue(mockActivity);

      const result = await service.create({
        name: 'Exercicio Pratico NestJS',
        courseId: 10,
        peso: 2,
      });

      expect(result).toEqual(mockActivity);
      expect(prisma.activities.create).toHaveBeenCalledWith({
        data: { name: 'Exercicio Pratico NestJS', courseId: 10, peso: 2 },
      });
    });
  });

  describe('findAll', () => {
    it('should return array of activities', async () => {
      (prisma.activities.findMany as jest.Mock).mockResolvedValue([mockActivity]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockActivity);
    });
  });

  describe('findOneOrFail', () => {
    it('should return activity when found', async () => {
      (prisma.activities.findUnique as jest.Mock).mockResolvedValue(mockActivity);

      const result = await service.findOneOrFail(1);

      expect(result).toEqual(mockActivity);
    });

    it('should throw NotFoundException when activity is null', async () => {
      (prisma.activities.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOneOrFail(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
