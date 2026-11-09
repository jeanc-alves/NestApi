import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import { PrismaService } from 'src/database/prisma.service';

describe('FilesService', () => {
  let service: FilesService;
  let prisma: jest.Mocked<Partial<PrismaService>>;

  const mockFile = {
    id: 1,
    name: 'document.pdf',
    path: '/uploads/document.pdf',
    size: 1024,
    ext: 'pdf',
    activityId: 10,
    userId: 1,
  };

  beforeEach(async () => {
    prisma = {
      files: {
        create: jest.fn().mockResolvedValue(mockFile),
        findMany: jest.fn().mockResolvedValue([mockFile]),
        findUnique: jest.fn().mockResolvedValue(mockFile),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a file record', async () => {
      const result = await service.create({
        name: 'document.pdf',
        path: '/uploads/document.pdf',
        size: 1024,
        ext: 'pdf',
        activityId: 10,
        userId: 1,
      });

      expect(result).toEqual(mockFile);
      expect(prisma.files.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all file records', async () => {
      const result = await service.findAll();

      expect(result).toEqual([mockFile]);
      expect(prisma.files.findMany).toHaveBeenCalled();
    });
  });
});
