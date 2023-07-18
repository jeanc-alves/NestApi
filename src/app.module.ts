import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaService } from './database/prisma.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { ActivitiesModule } from './activities/activities.module';
import { FilesModule } from './files/files.module';
import { RabbitMQService } from './rabbittmq/rabbittmq.service';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    CoursesModule,
    ActivitiesModule,
    FilesModule,
  ],
  controllers: [],
  providers: [RabbitMQService],
})
export class AppModule {}
