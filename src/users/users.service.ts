import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const { email, firstName, lastName, password, avatar, courseId, profile } =
      createUserDto;
    const hash = await bcrypt.hash(password, 10);
    const newUser = await this.prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hash,
        avatar,
        courseId,
        profile,
      },
    });

    return new UserEntity(newUser);
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany();
    return users.map((user) => new UserEntity(user));
  }

  async findOne(args: { id?: number; email?: string }): Promise<User | null> {
    if (args.id) {
      return this.prisma.user.findUnique({
        where: { id: args.id },
        include: { course: true },
      });
    }
    if (args.email) {
      return this.prisma.user.findUnique({
        where: { email: args.email },
        include: { course: true },
      });
    }
    return null;
  }

  async findOneOrFail(args: {
    id?: number;
    email?: string;
  }): Promise<UserEntity> {
    const user = await this.findOne(args);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return new UserEntity(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    await this.findOneOrFail({ id });
    const data: Record<string, unknown> = { ...updateUserDto };
    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });
    return new UserEntity(updated);
  }

  async remove(id: number): Promise<void> {
    await this.findOneOrFail({ id });
    await this.prisma.user.delete({ where: { id } });
  }
}
