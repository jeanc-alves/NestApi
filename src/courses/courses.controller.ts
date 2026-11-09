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
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Course, Profile, User } from '@prisma/client';
import { CoursesService, CourseWithRelations } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RoleGuard } from 'src/role/role.guard';
import { Roles } from 'src/role/roles.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResultDto } from 'src/common/dto/paginated-result.dto';

@ApiTags('Courses')
@ApiBearerAuth('JWT-auth')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Profile.ADMIN)
  @ApiOperation({ summary: 'Create a new course (Admin only)' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-admin' })
  @Post()
  async create(@Body() createCourseDto: CreateCourseDto): Promise<Course> {
    return this.coursesService.create(createCourseDto);
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'List all courses with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of courses' })
  @Get()
  async findAll(
    @Query() pagination?: PaginationQueryDto,
  ): Promise<PaginatedResultDto<CourseWithRelations>> {
    return this.coursesService.findAllPaginated(pagination);
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Find course by ID' })
  @ApiResponse({ status: 200, description: 'Course details' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CourseWithRelations> {
    return this.coursesService.findOneOrFail(Number(id));
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Profile.ADMIN)
  @ApiOperation({ summary: 'Enroll student into a course (Admin only)' })
  @ApiResponse({ status: 200, description: 'Student enrolled successfully' })
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
  @ApiOperation({ summary: 'Remove student from a course (Admin only)' })
  @ApiResponse({ status: 200, description: 'Student removed successfully' })
  @Delete('students/:userId')
  async removeStudent(@Param('userId') userId: string): Promise<User> {
    return this.coursesService.removeStudentCourse(Number(userId));
  }
}
