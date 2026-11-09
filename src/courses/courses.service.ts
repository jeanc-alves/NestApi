import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Course, Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResultDto } from 'src/common/dto/paginated-result.dto';

export type CourseWithRelations = Prisma.CourseGetPayload<{
  include: { users: true; activities: true };
}>;

export interface AddStudentDto {
  courseId: number;
  userId: number;
}

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    return this.prisma.course.create({ data: createCourseDto });
  }

  async addStudentCourse({
    courseId,
    userId,
  }: AddStudentDto): Promise<CourseWithRelations> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.courseId) {
      throw new BadRequestException('User is already registered in a course');
    }

    await this.findOneOrFail(courseId);

    await this.prisma.user.update({
      where: { id: userId },
      data: { courseId },
    });

    return this.findOneOrFail(courseId);
  }

  async removeStudentCourse(userId: number): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.courseId) {
      throw new BadRequestException('User is not registered in any course');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { courseId: null },
    });
  }

  async findAll(): Promise<CourseWithRelations[]> {
    return this.prisma.course.findMany({
      include: { users: true, activities: true },
    });
  }

  async findAllPaginated(
    pagination?: PaginationQueryDto,
  ): Promise<PaginatedResultDto<CourseWithRelations>> {
    const page = Number(pagination?.page) || 1;
    const limit = Number(pagination?.limit) || 10;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.course.count(),
      this.prisma.course.findMany({
        skip,
        take: limit,
        include: { users: true, activities: true },
        orderBy: { id: 'asc' },
      }),
    ]);

    return new PaginatedResultDto(items, total, page, limit);
  }

  async findOne(id: number): Promise<CourseWithRelations | null> {
    return this.prisma.course.findUnique({
      where: { id },
      include: { users: true, activities: true },
    });
  }

  async findOneOrFail(id: number): Promise<CourseWithRelations> {
    const course = await this.findOne(id);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }
}
