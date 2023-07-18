import { Test, TestingModule } from '@nestjs/testing';
import { RabbittmqService } from './rabbittmq.service';

describe('RabbittmqService', () => {
  let service: RabbittmqService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RabbittmqService],
    }).compile();

    service = module.get<RabbittmqService>(RabbittmqService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
