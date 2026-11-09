import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async isProcessed(messageId: string): Promise<boolean> {
    if (!messageId) return false;
    const existing = await this.prisma.processedMessage.findUnique({
      where: { id: messageId },
    });
    return !!existing;
  }

  async markAsProcessed(
    messageId: string,
    queue: string,
    eventType: string,
  ): Promise<void> {
    if (!messageId) return;
    try {
      await this.prisma.processedMessage.create({
        data: {
          id: messageId,
          queue,
          eventType,
        },
      });
    } catch (error: any) {
      this.logger.warn(
        `Failed to mark message ${messageId} as processed: ${error?.message}`,
      );
    }
  }
}
