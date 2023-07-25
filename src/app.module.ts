import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { ActivitiesModule } from './activities/activities.module';
import { FilesModule } from './files/files.module';
import { RabbitMQService } from './rabbittmq/rabbittmq.service';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    CoursesModule,
    ActivitiesModule,
    FilesModule,
    EmailModule,
  ],
  controllers: [],
  providers: [RabbitMQService],
})
export class AppModule {}
