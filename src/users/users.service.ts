import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/database/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({ data: createUserDto });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(args: { id?: number; username?: string }) {
    const query_scope = {
      id: async (id: number): Promise<any> => {
        return this.prisma.user.findUniqueOrThrow({
          select: { id: true, first_name: true, profile: true },
          where: { id },
        });
      },
      username: async (username: string): Promise<any> => {
        return this.prisma.user.findUniqueOrThrow({
          where: { username },
          select: { id: true, first_name: true, profile: true },
        });
      },
    };
    const keys = Object.keys(args);
    for (const key of keys) {
      if (Object.keys(query_scope).includes(key)) {
        const c = await query_scope[key](args[key]);
        return c;
      }
    }
    throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
