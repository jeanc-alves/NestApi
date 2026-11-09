import { Test, TestingModule } from '@nestjs/testing';
import { RabbitMQService } from './rabbittmq.service';

describe('RabbitMQService', () => {
  let service: RabbitMQService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RabbitMQService],
    }).compile();

    service = module.get<RabbitMQService>(RabbitMQService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should send message to channel buffer', async () => {
      const mockChannel = {
        sendToQueue: jest.fn().mockResolvedValue(true),
      };
      (service as any).channel = mockChannel;

      await expect(
        service.sendMessage('{"test": true}', 'test_queue'),
      ).resolves.toBeUndefined();
      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        'test_queue',
        expect.any(Buffer),
      );
    });
  });
});
