import { Injectable, Param } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ListUsersService {
  constructor(private prisma: PrismaService) {}

  public handle(@Param() params) {
    console.log('params: ', params);
    return this.prisma.user.findMany();
  }
}
