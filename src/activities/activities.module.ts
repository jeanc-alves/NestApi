import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { PrismaService } from 'src/database/prisma.service';
import { FilesModule } from 'src/files/files.module';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { RabbitMQService } from 'src/rabbittmq/rabbittmq.service';

@Module({
  imports: [FilesModule, AuthModule],
  controllers: [ActivitiesController],
  providers: [ActivitiesService, PrismaService, RabbitMQService],
})
export class ActivitiesModule {}
