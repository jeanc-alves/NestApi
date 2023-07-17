import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaService } from './database/prisma.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { ActivitiesModule } from './activities/activities.module';

@Module({
  imports: [UsersModule, AuthModule, CoursesModule, ActivitiesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
