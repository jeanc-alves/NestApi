import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/database/prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  async create(createUserDto: CreateUserDto) {
    const hash = await bcrypt.hash(createUserDto.password, 10);
    const userCreated = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hash,
      },
    });
    return userCreated;
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(args: { id?: number; email?: string }) {
    const query_scope = {
      id: async (id: number): Promise<any> => {
        try {
          return this.prisma.user.findUniqueOrThrow({
            include: { course: true },
            where: { id },
          });
        } catch (error) {
          throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
        }
      },
      email: async (email: string): Promise<any> => {
        try {
          return this.prisma.user.findUniqueOrThrow({
            where: { email },
            select: {
              id: true,
              firstName: true,
              profile: true,
              password: true,
            },
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
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
