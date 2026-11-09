import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RabbitMQService } from 'src/rabbittmq/rabbittmq.service';
import { IdempotencyService } from 'src/rabbittmq/idempotency.service';
import { EmailService } from 'src/email/email.service';
import { ActivityCreatedEvent } from 'src/rabbittmq/contracts/activity-created.event';
import { html } from '../resources/ActivitiesCreatedEmail';

@Injectable()
export class ActivitiesConsumer implements OnModuleInit {
  private readonly logger = new Logger(ActivitiesConsumer.name);

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly idempotencyService: IdempotencyService,
    private readonly emailService: EmailService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.rabbitMQService.consume<ActivityCreatedEvent>(
      RabbitMQService.DEFAULT_QUEUE,
      async (event) => {
        await this.handleActivityCreated(event);
      },
    );
  }

  async handleActivityCreated(event: ActivityCreatedEvent): Promise<void> {
    if (!event || !event.messageId) {
      return;
    }

    const alreadyProcessed = await this.idempotencyService.isProcessed(
      event.messageId,
    );

    if (alreadyProcessed) {
      this.logger.warn(
        `Duplicate message received: ${event.messageId}. Skipping processing.`,
      );
      return;
    }

    const { data } = event;
    if (data?.students && data.students.length > 0) {
      for (const student of data.students) {
        await this.emailService.sendMail({
          from: 'noreply@nestapi.com',
          to: student.email,
          html: html(student.name, data.courseName),
          subject: 'Nova atividade criada',
          text: `Nova atividade ${data.activityName} adicionada no curso ${data.courseName}`,
        });
      }
    }

    await this.idempotencyService.markAsProcessed(
      event.messageId,
      RabbitMQService.DEFAULT_QUEUE,
      event.eventType || 'activity.created',
    );
  }
}
