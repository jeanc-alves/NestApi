import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from 'src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { FilesModule } from 'src/files/files.module';

@Module({
  imports: [FilesModule],
  controllers: [UsersController],
  providers: [UsersService, PrismaService, JwtService],
  exports: [UsersService],
})
export class UsersModule {}
