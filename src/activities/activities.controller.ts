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
} from '@nestjs/common';
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
  @Get()
  async findAll(): Promise<Activities[]> {
    return this.activitiesService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Activities> {
    return this.activitiesService.findOneOrFail(Number(id));
  }

  @UseGuards(AuthGuard)
  @Get(':id/download-files')
  async downloadFiles(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const activity = await this.activitiesService.findOneOrFail(Number(id));
    return this.filesService.downloadZipFiles(activity, res);
  }
}
