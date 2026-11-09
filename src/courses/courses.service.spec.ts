import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { PrismaService } from 'src/database/prisma.service';

describe('CoursesService', () => {
  let service: CoursesService;
  let prisma: jest.Mocked<Partial<PrismaService>>;

  const mockCourse = {
    id: 1,
    name: 'NestJS Masterclass',
    sector: 'Technology',
    duration: 40,
    users: [],
    activities: [],
  };

  beforeEach(async () => {
    prisma = {
      course: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        count: jest.fn().mockResolvedValue(1),
      } as any,
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  describe('findOneOrFail', () => {
    it('should return course when found', async () => {
      (prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const result = await service.findOneOrFail(1);

      expect(result).toEqual(mockCourse);
    });

    it('should throw NotFoundException when course is null', async () => {
      (prisma.course.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOneOrFail(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllPaginated', () => {
    it('should return paginated result with meta', async () => {
      (prisma.course.findMany as jest.Mock).mockResolvedValue([mockCourse]);
      (prisma.course.count as jest.Mock).mockResolvedValue(15);

      const result = await service.findAllPaginated({ page: 1, limit: 10 });

      expect(result.items).toEqual([mockCourse]);
      expect(result.meta).toEqual({
        total: 15,
        page: 1,
        limit: 10,
        totalPages: 2,
        hasNext: true,
        hasPrev: false,
      });
    });
  });

  describe('create', () => {
    it('should create a course successfully', async () => {
      (prisma.course.create as jest.Mock).mockResolvedValue(mockCourse);

      const result = await service.create({
        name: 'NestJS Masterclass',
        sector: 'Technology',
        duration: 40,
      });

      expect(result).toEqual(mockCourse);
      expect(prisma.course.create).toHaveBeenCalled();
    });
  });

  describe('addStudentCourse', () => {
    it('should throw NotFoundException if user is not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.addStudentCourse({ courseId: 1, userId: 99 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is already in a course', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 10,
        courseId: 2,
      });

      await expect(
        service.addStudentCourse({ courseId: 1, userId: 10 }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
