import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQService } from './rabbittmq.service';
import { IdempotencyService } from './idempotency.service';
import { PrismaService } from 'src/database/prisma.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RabbitMQService, IdempotencyService, PrismaService],
  exports: [RabbitMQService, IdempotencyService],
})
export class RabbitMQModule {}
