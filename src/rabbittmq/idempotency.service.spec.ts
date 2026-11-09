import { Test, TestingModule } from '@nestjs/testing';
import { IdempotencyService } from './idempotency.service';
import { PrismaService } from 'src/database/prisma.service';

describe('IdempotencyService', () => {
  let service: IdempotencyService;
  let prisma: Partial<PrismaService>;

  const mockPrisma = {
    processedMessage: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotencyService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<IdempotencyService>(IdempotencyService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isProcessed', () => {
    it('should return false if messageId is empty', async () => {
      expect(await service.isProcessed('')).toBe(false);
    });

    it('should return true when record exists in database', async () => {
      mockPrisma.processedMessage.findUnique.mockResolvedValue({
        id: 'uuid-1',
        queue: 'test_queue',
        eventType: 'activity.created',
        processedAt: new Date(),
      });

      const result = await service.isProcessed('uuid-1');

      expect(result).toBe(true);
      expect(mockPrisma.processedMessage.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
    });

    it('should return false when record does not exist', async () => {
      mockPrisma.processedMessage.findUnique.mockResolvedValue(null);

      const result = await service.isProcessed('uuid-2');

      expect(result).toBe(false);
    });
  });

  describe('markAsProcessed', () => {
    it('should insert record into database', async () => {
      mockPrisma.processedMessage.create.mockResolvedValue({
        id: 'uuid-1',
        queue: 'test_queue',
        eventType: 'activity.created',
      });

      await service.markAsProcessed('uuid-1', 'test_queue', 'activity.created');

      expect(mockPrisma.processedMessage.create).toHaveBeenCalledWith({
        data: {
          id: 'uuid-1',
          queue: 'test_queue',
          eventType: 'activity.created',
        },
      });
    });

    it('should not throw if database insert fails', async () => {
      mockPrisma.processedMessage.create.mockRejectedValue(new Error('DB error'));

      await expect(
        service.markAsProcessed('uuid-1', 'test_queue', 'activity.created'),
      ).resolves.toBeUndefined();
    });
  });
});
