import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { ActivitiesConsumer } from './activities.consumer';
import { PrismaService } from 'src/database/prisma.service';
import { FilesModule } from 'src/files/files.module';
import { AuthModule } from 'src/auth/auth.module';
import { EmailService } from 'src/email/email.service';
import { CoursesService } from 'src/courses/courses.service';

@Module({
  imports: [FilesModule, AuthModule],
  controllers: [ActivitiesController],
  providers: [
    ActivitiesService,
    ActivitiesConsumer,
    PrismaService,
    EmailService,
    CoursesService,
  ],
})
export class ActivitiesModule {}
