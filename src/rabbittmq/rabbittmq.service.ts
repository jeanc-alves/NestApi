import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, Connection, Channel, ConsumeMessage, Options } from 'amqplib';

export interface ConsumeOptions {
  maxRetries?: number;
  retryDelayMs?: number;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private isConnecting = false;
  private shouldReconnect = true;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  public static readonly DEAD_LETTER_EXCHANGE = 'nestapi.dlx';
  public static readonly DEFAULT_QUEUE = 'new_activities_created';
  public static readonly DEFAULT_DLQ = 'new_activities_created.dlq';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.connectWithRetry();
  }

  async onModuleDestroy(): Promise<void> {
    this.shouldReconnect = false;
    await this.closeConnection();
  }

  private getQueueOptions(queueName: string): Options.AssertQueue {
    if (queueName === RabbitMQService.DEFAULT_QUEUE) {
      return {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': RabbitMQService.DEAD_LETTER_EXCHANGE,
          'x-dead-letter-routing-key': RabbitMQService.DEFAULT_DLQ,
        },
      };
    }
    return { durable: true };
  }

  private async connectWithRetry(retries = 5, delay = 2000): Promise<void> {
    if (this.isConnecting || !this.shouldReconnect) return;
    this.isConnecting = true;

    const url =
      this.configService.get<string>('RABBITMQ_URL') ||
      'amqp://guest:guest@localhost:5672';

    for (let attempt = 1; attempt <= retries; attempt++) {
      if (!this.shouldReconnect) break;
      try {
        this.connection = await connect(url);
        this.channel = await this.connection.createChannel();
        await this.channel.prefetch(10);

        this.connection.on('error', (err) => {
          if (!this.shouldReconnect) return;
          this.logger.error(`RabbitMQ connection error: ${err.message}`);
          this.handleDisconnect();
        });

        this.connection.on('close', () => {
          if (!this.shouldReconnect) return;
          this.logger.warn('RabbitMQ connection closed');
          this.handleDisconnect();
        });

        await this.setupTopologies();
        this.isConnecting = false;
        return;
      } catch (error: any) {
        this.logger.warn(
          `Failed to connect to RabbitMQ (attempt ${attempt}/${retries}): ${error.message}`,
        );
        if (attempt < retries && this.shouldReconnect) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    this.isConnecting = false;
  }

  private handleDisconnect(): void {
    if (!this.shouldReconnect) return;
    this.channel = null;
    this.connection = null;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.reconnectTimeout = setTimeout(() => {
      this.connectWithRetry();
    }, 5000);
    if (this.reconnectTimeout.unref) {
      this.reconnectTimeout.unref();
    }
  }

  private async setupTopologies(): Promise<void> {
    if (!this.channel) return;

    await this.channel.assertExchange(RabbitMQService.DEAD_LETTER_EXCHANGE, 'direct', {
      durable: true,
    });

    await this.channel.assertQueue(RabbitMQService.DEFAULT_DLQ, {
      durable: true,
    });

    await this.channel.bindQueue(
      RabbitMQService.DEFAULT_DLQ,
      RabbitMQService.DEAD_LETTER_EXCHANGE,
      RabbitMQService.DEFAULT_DLQ,
    );

    await this.channel.assertQueue(
      RabbitMQService.DEFAULT_QUEUE,
      this.getQueueOptions(RabbitMQService.DEFAULT_QUEUE),
    );
  }

  async publish<T>(
    queueName: string,
    message: T,
    headers: Record<string, any> = {},
  ): Promise<boolean> {
    try {
      if (!this.channel) {
        await this.connectWithRetry();
      }
      if (!this.channel) {
        throw new Error('RabbitMQ channel not available');
      }

      await this.channel.assertQueue(queueName, this.getQueueOptions(queueName));

      const payload = Buffer.from(
        typeof message === 'string' ? message : JSON.stringify(message),
      );

      return this.channel.sendToQueue(queueName, payload, {
        persistent: true,
        headers,
      });
    } catch (error) {
      throw new HttpException(
        'Error when try send a message to RabbitMQ',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async consume<T>(
    queueName: string,
    onMessage: (data: T, headers: Record<string, any>, rawMsg: ConsumeMessage) => Promise<void>,
    options: ConsumeOptions = {},
  ): Promise<void> {
    const { maxRetries = 3, retryDelayMs = 1000 } = options;

    if (!this.channel) {
      await this.connectWithRetry();
    }
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    await this.channel.assertQueue(queueName, this.getQueueOptions(queueName));

    await this.channel.consume(queueName, async (rawMsg) => {
      if (!rawMsg) return;

      const headers = rawMsg.properties.headers || {};
      const currentRetries = Number(headers['x-retry-count'] || 0);

      try {
        const content = rawMsg.content.toString();
        let parsed: T;
        try {
          parsed = JSON.parse(content) as T;
        } catch {
          parsed = content as unknown as T;
        }

        await onMessage(parsed, headers, rawMsg);
        this.channel?.ack(rawMsg);
      } catch (err: any) {
        if (currentRetries < maxRetries) {
          const nextRetry = currentRetries + 1;
          const backoff = retryDelayMs * Math.pow(2, currentRetries);

          await new Promise((resolve) => setTimeout(resolve, backoff));

          if (this.channel) {
            this.channel.sendToQueue(queueName, rawMsg.content, {
              persistent: true,
              headers: {
                ...headers,
                'x-retry-count': nextRetry,
                'x-exception-message': err?.message || 'Unknown error',
                'x-retried-at': new Date().toISOString(),
              },
            });
            this.channel.ack(rawMsg);
          }
        } else {
          if (this.channel) {
            this.channel.sendToQueue(
              RabbitMQService.DEFAULT_DLQ,
              rawMsg.content,
              {
                persistent: true,
                headers: {
                  ...headers,
                  'x-dead-letter-reason': 'max-retries-exceeded',
                  'x-exception-message': err?.message || 'Unknown error',
                  'x-exception-stack': err?.stack || '',
                  'x-original-queue': queueName,
                  'x-failed-at': new Date().toISOString(),
                  'x-retry-count': currentRetries,
                },
              },
            );
            this.channel.ack(rawMsg);
          }
        }
      }
    });
  }

  async initialize(queueName = RabbitMQService.DEFAULT_QUEUE): Promise<void> {
    if (!this.connection || !this.channel) {
      await this.connectWithRetry();
    }
    if (this.channel) {
      await this.channel.assertQueue(queueName, this.getQueueOptions(queueName));
    }
  }

  async sendMessage(message: string, queueName: string): Promise<void> {
    await this.publish(queueName, message);
  }

  async closeConnection(): Promise<void> {
    this.shouldReconnect = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
    } catch {
      this.channel = null;
      this.connection = null;
    }
  }

  getChannel(): Channel | null {
    return this.channel;
  }

  getConnection(): Connection | null {
    return this.connection;
  }
}
