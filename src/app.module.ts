import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CreateUsersController } from './controllers/users/create.users.controller';
import { CreateUserService } from './services/users/create.users.service';
import { PrismaService } from './prisma.service';

@Module({
  imports: [],
  controllers: [AppController, CreateUsersController],
  providers: [AppService, CreateUserService, PrismaService],
})
export class AppModule {}
