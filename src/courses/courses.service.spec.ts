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

  describe('addStudentCourse', () => {
    it('should throw NotFoundException when student does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.addStudentCourse({ courseId: 1, userId: 999 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when student already has a course', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        courseId: 2,
      });

      await expect(
        service.addStudentCourse({ courseId: 1, userId: 1 }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
