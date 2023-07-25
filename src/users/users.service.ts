import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/database/prisma.service';

import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  async create(createUserDto: CreateUserDto) {
    const { email, firstName, password, avatar, courseId, createdAt, profile } =
      createUserDto;
    const hash = await bcrypt.hash(password, 10);
    const newUser = await this.prisma.user.create({
      data: {
        email,
        firstName,
        password: hash,
        avatar,
        courseId,
        createdAt,
      },
    });

    return this.prisma.user.findUnique({
      where: { id: newUser.id },
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(args: { id?: number; email?: string }) {
    const query_scope = {
      id: async (id: number) => {
        try {
          return this.prisma.user.findUnique({
            include: { course: true },
            where: { id },
          });
        } catch (error) {
          throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
        }
      },
      email: async (email: string) => {
        try {
          return this.prisma.user.findUnique({
            where: { email },
          });
        } catch (error) {
          throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
        }
      },
    };
    const keys = Object.keys(args);
    for (const key of keys) {
      if (Object.keys(query_scope).includes(key)) {
        return query_scope[key](args[key]);
      }
    }
    throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
  }

  async verifyPermission(user: User) {
    try {
      if (user.profile !== 'ADMIN') {
        throw new HttpException(
          `action not allowed for this profile: ${user.profile}`,
          HttpStatus.UNAUTHORIZED,
        );
      }
    } catch (error) {
      if ((error.status = HttpStatus.UNAUTHORIZED)) {
        throw new HttpException(error.message, error.status);
      }
    }
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    const { avatar } = updateUserDto;
    return this.prisma.user.update({
      where: { id: +id },
      data: {
        avatar,
      },
    });
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
