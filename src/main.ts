import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3333);

  await app.listen(port);
}
bootstrap();
