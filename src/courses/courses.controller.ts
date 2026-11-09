import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Course, Profile, User } from '@prisma/client';
import { CoursesService, CourseWithRelations } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RoleGuard } from 'src/role/role.guard';
import { Roles } from 'src/role/roles.decorator';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Profile.ADMIN)
  @Post()
  async create(@Body() createCourseDto: CreateCourseDto): Promise<Course> {
    return this.coursesService.create(createCourseDto);
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAll(): Promise<CourseWithRelations[]> {
    return this.coursesService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CourseWithRelations> {
    return this.coursesService.findOneOrFail(Number(id));
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Profile.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Post(':id/students')
  async addStudent(
    @Param('id') courseId: string,
    @Body('userId') userId: number,
  ): Promise<CourseWithRelations> {
    return this.coursesService.addStudentCourse({
      courseId: Number(courseId),
      userId: Number(userId),
    });
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Profile.ADMIN)
  @Delete('students/:userId')
  async removeStudent(@Param('userId') userId: string): Promise<User> {
    return this.coursesService.removeStudentCourse(Number(userId));
  }
}
