import { Module } from '@nestjs/common';
import { CreateUsersController } from 'src/controllers/users/create.users.controller';
import { PrismaService } from 'src/prisma.service';
import { CreateUserService } from 'src/services/users/create.users.service';

@Module({
  controllers: [CreateUsersController],
  providers: [CreateUserService, PrismaService],
})
export class UsersModule {}
