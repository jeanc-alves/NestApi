import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesConsumer } from './activities.consumer';
import { RabbitMQService } from 'src/rabbittmq/rabbittmq.service';
import { IdempotencyService } from 'src/rabbittmq/idempotency.service';
import { EmailService } from 'src/email/email.service';
import { ActivityCreatedEvent } from 'src/rabbittmq/contracts/activity-created.event';

describe('ActivitiesConsumer', () => {
  let consumer: ActivitiesConsumer;
  let rabbitMQService: Partial<RabbitMQService>;
  let idempotencyService: Partial<IdempotencyService>;
  let emailService: Partial<EmailService>;

  const mockRabbitMQ = {
    consume: jest.fn(),
  };

  const mockIdempotency = {
    isProcessed: jest.fn(),
    markAsProcessed: jest.fn(),
  };

  const mockEmail = {
    sendMail: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesConsumer,
        {
          provide: RabbitMQService,
          useValue: mockRabbitMQ,
        },
        {
          provide: IdempotencyService,
          useValue: mockIdempotency,
        },
        {
          provide: EmailService,
          useValue: mockEmail,
        },
      ],
    }).compile();

    consumer = module.get<ActivitiesConsumer>(ActivitiesConsumer);
    rabbitMQService = module.get<RabbitMQService>(RabbitMQService);
    idempotencyService = module.get<IdempotencyService>(IdempotencyService);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  it('should register consumer onModuleInit', async () => {
    await consumer.onModuleInit();
    expect(mockRabbitMQ.consume).toHaveBeenCalledWith(
      RabbitMQService.DEFAULT_QUEUE,
      expect.any(Function),
    );
  });

  describe('handleActivityCreated', () => {
    const sampleEvent: ActivityCreatedEvent = {
      messageId: 'msg-uuid-123',
      eventType: 'activity.created',
      timestamp: new Date().toISOString(),
      data: {
        activityId: 10,
        activityName: 'Prova Final',
        courseId: 2,
        courseName: 'TypeScript Master',
        peso: 5,
        students: [
          { id: 1, name: 'Alice Silva', email: 'alice@test.com' },
          { id: 2, name: 'Bob Souza', email: 'bob@test.com' },
        ],
      },
    };

    it('should process event and send emails when not previously processed', async () => {
      mockIdempotency.isProcessed.mockResolvedValue(false);

      await consumer.handleActivityCreated(sampleEvent);

      expect(mockIdempotency.isProcessed).toHaveBeenCalledWith('msg-uuid-123');
      expect(mockEmail.sendMail).toHaveBeenCalledTimes(2);
      expect(mockIdempotency.markAsProcessed).toHaveBeenCalledWith(
        'msg-uuid-123',
        RabbitMQService.DEFAULT_QUEUE,
        'activity.created',
      );
    });

    it('should skip email dispatch and mark when already processed (idempotent)', async () => {
      mockIdempotency.isProcessed.mockResolvedValue(true);

      await consumer.handleActivityCreated(sampleEvent);

      expect(mockIdempotency.isProcessed).toHaveBeenCalledWith('msg-uuid-123');
      expect(mockEmail.sendMail).not.toHaveBeenCalled();
      expect(mockIdempotency.markAsProcessed).not.toHaveBeenCalled();
    });

    it('should ignore event without messageId', async () => {
      await consumer.handleActivityCreated({} as any);

      expect(mockIdempotency.isProcessed).not.toHaveBeenCalled();
      expect(mockEmail.sendMail).not.toHaveBeenCalled();
    });
  });
});
