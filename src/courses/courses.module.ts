import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { PrismaClient } from '@prisma/client';

@Module({
  controllers: [CoursesController],
  providers: [CoursesService, PrismaClient],
})
export class CoursesModule {}
