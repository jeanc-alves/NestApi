import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { PrismaClient } from '@prisma/client';

export class addStudentDto {
  courseId: number;
  userId: number;
}

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaClient) {}

  async create(createCourseDto: CreateCourseDto) {
    return this.prisma.course.create({ data: createCourseDto });
  }

  async addStudentCourse(courseId?: number, userId?: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { course: true },
    });
    if (!user.course) {
      throw new HttpException(
        'User have a registered course',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { courseId: courseId },
      include: { course: true },
    });
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
    return `This action returns all courses`;
  }

  findOne(id: number) {
    return `This action returns a #${id} course`;
  }

  update(id: number, updateCourseDto: UpdateCourseDto) {
    return `This action updates a #${id} course`;
  }

  remove(id: number) {
    return `This action removes a #${id} course`;
  }
}
