import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  HttpException,
  UseGuards,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { UsersService } from 'src/users/users.service';

@Controller('courses')
export class CoursesController {
  constructor(
    private coursesService: CoursesService,
    private userService: UsersService,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/:id')
  async addStudant(@Param('id') courseId: number, @Body() { userId }) {
    try {
      const user = await this.userService.findOne({ id: userId });
      return this.coursesService.addStudentCourse({
        courseId: +courseId,
        user,
      });
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Delete('/:id/removeStudantCourse')
  async removeStudentCourse(@Param('id') userId: number) {
    try {
      return this.coursesService.removeStudentCourse(+userId);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  @Get()
  findAll() {
    return this.coursesService.findAll();
  }
}
