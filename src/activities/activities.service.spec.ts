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
        count: jest.fn().mockResolvedValue(1),
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
        data: {
          name: 'Exercicio Pratico NestJS',
          courseId: 10,
          peso: 2,
        },
      });
    });
  });

  describe('findAllPaginated', () => {
    it('should return paginated activities with meta', async () => {
      (prisma.activities.findMany as jest.Mock).mockResolvedValue([mockActivity]);
      (prisma.activities.count as jest.Mock).mockResolvedValue(5);

      const result = await service.findAllPaginated({ page: 1, limit: 10 });

      expect(result.items).toEqual([mockActivity]);
      expect(result.meta).toEqual({
        total: 5,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });
  });

  describe('findOneOrFail', () => {
    it('should return activity when found', async () => {
      (prisma.activities.findUnique as jest.Mock).mockResolvedValue(
        mockActivity,
      );

      const result = await service.findOneOrFail(1);

      expect(result).toEqual(mockActivity);
    });

    it('should throw NotFoundException when activity is not found', async () => {
      (prisma.activities.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOneOrFail(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
