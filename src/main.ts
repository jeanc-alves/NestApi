import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { RabbitMQService } from './rabbittmq/rabbittmq.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const rabbitMQService = app.get<RabbitMQService>(RabbitMQService);
  await rabbitMQService.initialize();
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3333);
}
bootstrap();
