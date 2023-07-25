import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  HttpException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { UsersService } from 'src/users/users.service';
import { Course } from '@prisma/client';
import { RoleGuard } from 'src/role/role.guard';

@Controller('courses')
export class CoursesController {
  constructor(
    private coursesService: CoursesService,
    private userService: UsersService,
  ) {}
  @UseGuards(RoleGuard)
  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }
  @UseGuards(AuthGuard)
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/:id')
  async addStudant(
    @Param('id') courseId: number,
    @Body() { userId },
  ): Promise<Course | HttpException> {
    try {
      const user = await this.userService.findOne({ id: userId });
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      return this.coursesService.addStudentCourse({
        courseId: +courseId,
        user,
      });
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }
  @UseGuards(AuthGuard)
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @Delete('/:id/removeStudantCourse')
  async removeStudentCourse(
    @Param('id') id: string,
    @Req() req: Response,
  ): Promise<any> {
    try {
      return this.coursesService.removeStudentCourse(req, +id);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  @Get()
  async findAll(): Promise<Course[]> {
    return this.coursesService.findAll();
  }
}
