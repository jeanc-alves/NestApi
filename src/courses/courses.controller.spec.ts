import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

describe('CoursesController', () => {
  let controller: CoursesController;
  let coursesService: jest.Mocked<Partial<CoursesService>>;

  const mockCourse = {
    id: 1,
    name: 'NestJS Course',
    sector: 'Tech',
    duration: 30,
    users: [],
    activities: [],
  };

  const mockPaginated = {
    items: [mockCourse],
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
    coursesService = {
      create: jest.fn().mockResolvedValue(mockCourse),
      findAll: jest.fn().mockResolvedValue([mockCourse]),
      findAllPaginated: jest.fn().mockResolvedValue(mockPaginated as any),
      findOneOrFail: jest.fn().mockResolvedValue(mockCourse),
      addStudentCourse: jest.fn().mockResolvedValue(mockCourse),
      removeStudentCourse: jest.fn().mockResolvedValue({ id: 2, courseId: null } as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        {
          provide: CoursesService,
          useValue: coursesService,
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

    controller = module.get<CoursesController>(CoursesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated courses', async () => {
      const result = await controller.findAll({ page: 1, limit: 10 });
      expect(result).toEqual(mockPaginated);
      expect(coursesService.findAllPaginated).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe('findOne', () => {
    it('should return course by id', async () => {
      const result = await controller.findOne('1');
      expect(result).toEqual(mockCourse);
      expect(coursesService.findOneOrFail).toHaveBeenCalledWith(1);
    });
  });
});
