import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CreateUserService {
  constructor(private prisma: PrismaService) {}

  public async handle(data: Prisma.UserCreateInput): Promise<User> {
    try {
      const user = await this.prisma.user.create({ data });
      return user;
    } catch (error) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
  }
}
