import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';

import { PrismaService } from 'src/database/prisma.service';
import { User } from 'src/activities/interfaces/index';

export class addStudentDto {
  courseId: number;
  user: User;
}

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(createCourseDto: CreateCourseDto) {
    return this.prisma.course.create({ data: createCourseDto });
  }

  async addStudentCourse({ courseId, user }: addStudentDto) {
    if (user.course) {
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
      new HttpException('Course Not Found', HttpStatus.NOT_FOUND);
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { courseId: courseId },
      include: { course: true },
    });

    return { course };
  }

  async removeStudentCourse(userId?: number) {
    try {
      const existStudantCourse = await this.prisma.user.findFirstOrThrow({
        where: { id: userId },
        include: { course: true },
      });

      if (existStudantCourse.course) {
        return this.prisma.user.update({
          where: { id: userId },
          data: {
            course: { delete: { id: existStudantCourse.courseId } },
          },
        });
      }
      return;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new HttpException(error.meta.cause, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(error.message, error.status);
    }
  }

  findAll() {
    return this.prisma.course.findMany();
  }
  findOne(id) {
    return this.prisma.course.findUnique({ where: { id } });
  }
}
