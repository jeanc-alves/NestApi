import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RabbitMQService } from './rabbittmq.service';

describe('RabbitMQService', () => {
  let service: RabbitMQService;
  let mockChannel: any;
  let mockConnection: any;

  beforeEach(async () => {
    mockChannel = {
      assertExchange: jest.fn().mockResolvedValue({}),
      assertQueue: jest.fn().mockResolvedValue({}),
      bindQueue: jest.fn().mockResolvedValue({}),
      prefetch: jest.fn().mockResolvedValue({}),
      sendToQueue: jest.fn().mockReturnValue(true),
      consume: jest.fn(),
      ack: jest.fn(),
      nack: jest.fn(),
      close: jest.fn().mockResolvedValue({}),
    };

    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      on: jest.fn(),
      close: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitMQService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              if (key === 'RABBITMQ_URL') return 'amqp://guest:guest@localhost:5672';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RabbitMQService>(RabbitMQService);
    (service as any).channel = mockChannel;
    (service as any).connection = mockConnection;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('publish', () => {
    it('should send persistent message to queue with headers', async () => {
      const payload = { event: 'test' };
      const headers = { 'x-correlation-id': '123' };

      const result = await service.publish('test_queue', payload, headers);

      expect(result).toBe(true);
      expect(mockChannel.assertQueue).toHaveBeenCalledWith('test_queue', { durable: true });
      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        'test_queue',
        Buffer.from(JSON.stringify(payload)),
        { persistent: true, headers },
      );
    });

    it('should support string messages via sendMessage', async () => {
      await service.sendMessage('test string', 'test_queue');

      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        'test_queue',
        Buffer.from('test string'),
        { persistent: true, headers: {} },
      );
    });
  });

  describe('consume', () => {
    it('should acknowledge message when handler succeeds', async () => {
      let registeredCallback: Function = () => {};
      mockChannel.consume.mockImplementation((queue: string, cb: Function) => {
        registeredCallback = cb;
      });

      const handler = jest.fn().mockResolvedValue(undefined);
      await service.consume('test_queue', handler);

      const fakeMsg = {
        content: Buffer.from(JSON.stringify({ test: 123 })),
        properties: { headers: {} },
      };

      await registeredCallback(fakeMsg);

      expect(handler).toHaveBeenCalledWith({ test: 123 }, {}, fakeMsg);
      expect(mockChannel.ack).toHaveBeenCalledWith(fakeMsg);
    });

    it('should retry with backoff and updated headers on error when retries < maxRetries', async () => {
      let registeredCallback: Function = () => {};
      mockChannel.consume.mockImplementation((queue: string, cb: Function) => {
        registeredCallback = cb;
      });

      const handler = jest.fn().mockRejectedValue(new Error('Simulated failure'));
      await service.consume('test_queue', handler, { maxRetries: 3, retryDelayMs: 10 });

      const fakeMsg = {
        content: Buffer.from(JSON.stringify({ test: 123 })),
        properties: { headers: { 'x-retry-count': 1 } },
      };

      await registeredCallback(fakeMsg);

      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        'test_queue',
        fakeMsg.content,
        expect.objectContaining({
          persistent: true,
          headers: expect.objectContaining({
            'x-retry-count': 2,
            'x-exception-message': 'Simulated failure',
          }),
        }),
      );
      expect(mockChannel.ack).toHaveBeenCalledWith(fakeMsg);
    });

    it('should send to DLQ and ack original when retries reach maxRetries', async () => {
      let registeredCallback: Function = () => {};
      mockChannel.consume.mockImplementation((queue: string, cb: Function) => {
        registeredCallback = cb;
      });

      const handler = jest.fn().mockRejectedValue(new Error('Persistent failure'));
      await service.consume('test_queue', handler, { maxRetries: 2, retryDelayMs: 10 });

      const fakeMsg = {
        content: Buffer.from(JSON.stringify({ test: 123 })),
        properties: { headers: { 'x-retry-count': 2 } },
      };

      await registeredCallback(fakeMsg);

      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        RabbitMQService.DEFAULT_DLQ,
        fakeMsg.content,
        expect.objectContaining({
          persistent: true,
          headers: expect.objectContaining({
            'x-dead-letter-reason': 'max-retries-exceeded',
            'x-exception-message': 'Persistent failure',
            'x-original-queue': 'test_queue',
          }),
        }),
      );
      expect(mockChannel.ack).toHaveBeenCalledWith(fakeMsg);
    });
  });

  describe('closeConnection', () => {
    it('should close channel and connection cleanly', async () => {
      await service.closeConnection();

      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
      expect(service.getChannel()).toBeNull();
      expect(service.getConnection()).toBeNull();
    });
  });
});
