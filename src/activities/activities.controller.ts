import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  Request,
  UseGuards,
  UploadedFiles,
  ParseFilePipeBuilder,
  HttpStatus,
  Res,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Activities, Profile } from '@prisma/client';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RoleGuard } from 'src/role/role.guard';
import { Roles } from 'src/role/roles.decorator';
import { FilesService } from 'src/files/files.service';
import { RabbitMQService } from 'src/rabbittmq/rabbittmq.service';
import { CoursesService } from 'src/courses/courses.service';
import { IResponseCreateActivities } from './interfaces';
import { ActivityCreatedEvent } from 'src/rabbittmq/contracts/activity-created.event';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResultDto } from 'src/common/dto/paginated-result.dto';

@ApiTags('Activities')
@ApiBearerAuth('JWT-auth')
@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly filesService: FilesService,
    private readonly rabbitMQService: RabbitMQService,
    private readonly courseService: CoursesService,
  ) {}

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Profile.ADMIN)
  @ApiOperation({ summary: 'Create an activity with optional PDF uploads (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Activity created and event dispatched' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-admin' })
  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: 'pdf' })
        .addMaxSizeValidator({ maxSize: 50000000 })
        .build({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    files: Array<Express.Multer.File>,
    @Body() body: CreateActivityDto,
    @Request() req,
  ): Promise<IResponseCreateActivities> {
    const { name, courseId, peso } = body;
    const course = await this.courseService.findOneOrFail(Number(courseId));

    const activity = await this.activitiesService.create({
      name,
      courseId: Number(courseId),
      peso: Number(peso),
    });

    let uploadedFiles;
    if (files && files.length > 0) {
      uploadedFiles = await this.filesService.uploadMultipleFiles(
        files,
        activity.id,
        req.user?.sub,
      );
    }

    const activityWithDetails = await this.activitiesService.findOneOrFail(
      activity.id,
    );

    const students = (course.users || []).map((student) => ({
      id: student.id,
      name: `${student.firstName} ${student.lastName || ''}`.trim(),
      email: student.email,
    }));

    const event: ActivityCreatedEvent = {
      messageId: randomUUID(),
      eventType: 'activity.created',
      timestamp: new Date().toISOString(),
      data: {
        activityId: activity.id,
        activityName: activity.name,
        courseId: course.id,
        courseName: course.name,
        peso: activity.peso,
        students,
      },
    };

    await this.rabbitMQService.publish(
      RabbitMQService.DEFAULT_QUEUE,
      event,
    );

    return {
      activity: activityWithDetails,
      email_sent_to: students.map((s) => s.email),
      files: uploadedFiles,
    };
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'List all activities with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of activities' })
  @Get()
  async findAll(
    @Query() pagination?: PaginationQueryDto,
  ): Promise<PaginatedResultDto<Activities>> {
    return this.activitiesService.findAllPaginated(pagination);
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Find activity by ID' })
  @ApiResponse({ status: 200, description: 'Activity details' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Activities> {
    return this.activitiesService.findOneOrFail(Number(id));
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Stream and download all activity PDFs as a single ZIP archive' })
  @ApiResponse({ status: 200, description: 'ZIP archive binary stream' })
  @ApiResponse({ status: 404, description: 'No files found for this activity' })
  @Get(':id/download-files')
  async downloadFiles(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const activity = await this.activitiesService.findOneOrFail(Number(id));
    return this.filesService.downloadZipFiles(activity, res);
  }
}
