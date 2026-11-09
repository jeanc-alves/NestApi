import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { PrismaService } from './database/prisma.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { ActivitiesModule } from './activities/activities.module';
import { FilesModule } from './files/files.module';
import { RabbitMQModule } from './rabbittmq/rabbittmq.module';
import { EmailModule } from './email/email.module';
import { validate } from './config/env.validation';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { PrismaClientExceptionFilter } from './filters/prisma-client-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    RabbitMQModule,
    UsersModule,
    AuthModule,
    CoursesModule,
    ActivitiesModule,
    FilesModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [
    PrismaService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaClientExceptionFilter,
    },
  ],
})
export class AppModule {}
