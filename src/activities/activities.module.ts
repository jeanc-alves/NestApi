import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { PrismaService } from 'src/database/prisma.service';
import { FilesModule } from 'src/files/files.module';
import { AuthModule } from 'src/auth/auth.module';
import { RabbitMQService } from 'src/rabbittmq/rabbittmq.service';
import { EmailService } from 'src/email/email.service';
import { CoursesService } from 'src/courses/courses.service';

@Module({
  imports: [FilesModule, AuthModule],
  controllers: [ActivitiesController],
  providers: [
    ActivitiesService,
    PrismaService,
    RabbitMQService,
    EmailService,
    CoursesService,
  ],
})
export class ActivitiesModule {}
