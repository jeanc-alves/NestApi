import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CreateUsersController } from './controllers/users/create.users.controller';
import { PrismaService } from './prisma.service';
import { ListUsersService } from './services/users/list-users/list-users.service';
import { ListUsersController } from './controllers/users/list-users/list-users.controller';
import { CreateUserService } from './services/users/create.users.service';
import { UsersModule } from './users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
