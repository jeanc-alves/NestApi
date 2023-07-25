import { HttpException, HttpStatus, Injectable, Res } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';

import { PrismaService } from 'src/database/prisma.service';

import { Course, User } from '@prisma/client';

export class addStudentDto {
  courseId: number;
  user?: User;
}

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    return this.prisma.course.create({ data: createCourseDto });
  }

  async addStudentCourse({ courseId, user }: addStudentDto): Promise<Course> {
    if (user.courseId) {
      throw new HttpException(
        'User have a registered course',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const course = await this.prisma.course.findFirst({
      where: { id: courseId },
      include: { users: true },
    });
    if (!course) {
      throw new HttpException('Course Not Found', HttpStatus.NOT_FOUND);
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { courseId: courseId },
      include: { course: true },
    });

    return this.prisma.course.findFirst({
      where: { id: courseId },
      include: { users: true },
    });
  }

  async removeStudentCourse(@Res() res, userId?: number): Promise<User | any> {
    try {
      const existStudantCourse = await this.prisma.user.findFirst({
        where: { id: userId },
        include: { course: true },
      });

      if (existStudantCourse.course) {
        return this.prisma.user.update({
          where: { id: userId },
          data: {
            courseId: null,
          },
        });
      }
      return res.status(HttpStatus.NO_CONTENT);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new HttpException(error.meta.cause, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(error.message, error.status);
    }
  }

  async findAll(): Promise<Course[]> {
    return this.prisma.course.findMany({ include: { users: true } });
  }
  findOne(id: number): Promise<Course | null> {
    return this.prisma.course.findUnique({ where: { id } });
  }
}
