import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PassThrough, Readable } from 'stream';
import { FilesService } from './files.service';
import { PrismaService } from 'src/database/prisma.service';
import * as fs from 'fs';

describe('FilesService', () => {
  let service: FilesService;
  let prisma: jest.Mocked<Partial<PrismaService>>;

  const mockFile = {
    id: 1,
    name: 'document.pdf',
    path: '/uploads/random-uuid.pdf',
    size: 1024,
    ext: 'pdf',
    activityId: 10,
    userId: 1,
  };

  beforeEach(async () => {
    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'mkdirSync').mockReturnValue(undefined as any);
    jest
      .spyOn(fs, 'createReadStream')
      .mockImplementation(() => Readable.from(Buffer.from('fake pdf content')) as any);

    prisma = {
      files: {
        create: jest.fn().mockResolvedValue(mockFile),
        findMany: jest.fn().mockResolvedValue([mockFile]),
        findUnique: jest.fn().mockResolvedValue(mockFile),
        update: jest.fn().mockResolvedValue(mockFile),
        delete: jest.fn().mockResolvedValue(mockFile),
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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateMagicNumber', () => {
    it('should allow valid PDF buffer starting with %PDF', () => {
      const validPdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
      expect(() => service.validateMagicNumber(validPdfBuffer, 'pdf')).not.toThrow();
    });

    it('should throw BadRequestException for invalid PDF signature', () => {
      const invalidBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00]);
      expect(() => service.validateMagicNumber(invalidBuffer, 'pdf')).toThrow(
        BadRequestException,
      );
    });

    it('should allow valid JPEG buffer', () => {
      const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      expect(() => service.validateMagicNumber(validJpeg, 'image')).not.toThrow();
    });

    it('should allow valid PNG buffer', () => {
      const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      expect(() => service.validateMagicNumber(validPng, 'image')).not.toThrow();
    });

    it('should throw BadRequestException for empty or small buffer', () => {
      expect(() => service.validateMagicNumber(Buffer.from([]), 'pdf')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('uploadFile', () => {
    it('should upload valid PDF file with UUID name and record in database', async () => {
      const fakeFile: any = {
        originalname: 'trabalho.pdf',
        buffer: Buffer.from([0x25, 0x50, 0x44, 0x46, 0x00]),
        size: 5,
      };

      const result = await service.uploadFile(fakeFile, 1, 10);

      expect(result).toEqual(mockFile);
      expect(prisma.files.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'trabalho.pdf',
          ext: 'pdf',
          size: 5,
          userId: 1,
          activityId: 10,
        }),
      });
    });

    it('should reject file when content signature does not match PDF', async () => {
      const fakeExecutable: any = {
        originalname: 'malicious.pdf',
        buffer: Buffer.from([0x4d, 0x5a, 0x00, 0x00]),
        size: 4,
      };

      await expect(service.uploadFile(fakeExecutable, 1, 10)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('downloadZipFiles', () => {
    it('should respond with 404 when no files are provided', async () => {
      (prisma.files.findMany as jest.Mock).mockResolvedValue([]);
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        setHeader: jest.fn(),
      };

      await service.downloadZipFiles([], res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 }),
      );
    });

    it('should stream zip directly to response when files exist', async () => {
      const res: any = new PassThrough();
      res.setHeader = jest.fn();
      res.status = jest.fn().mockReturnThis();
      res.json = jest.fn();

      await service.downloadZipFiles(
        { files: [{ name: 'file1.pdf', path: '/uploads/uuid1.pdf' }] },
        res,
      );

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/zip');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="archive.zip"',
      );
    });
  });

  describe('findOne', () => {
    it('should return file when found', async () => {
      const result = await service.findOne(1);
      expect(result).toEqual(mockFile);
    });

    it('should throw NotFoundException when file not found', async () => {
      prisma.files.findUnique = jest.fn().mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });
});
