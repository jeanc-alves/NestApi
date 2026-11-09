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
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Activities } from '@prisma/client';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RoleGuard } from 'src/role/role.guard';
import { FilesService } from 'src/files/files.service';
import { RabbitMQService } from 'src/rabbittmq/rabbittmq.service';
import { EmailService } from 'src/email/email.service';
import { CoursesService } from 'src/courses/courses.service';
import { html } from '../resources/ActivitiesCreatedEmail';
import { IResponseCreateActivities } from './interfaces';

@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly filesService: FilesService,
    private readonly rabbitMQService: RabbitMQService,
    private readonly emailService: EmailService,
    private readonly courseService: CoursesService,
  ) {}

  @UseGuards(AuthGuard, RoleGuard)
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

    await this.rabbitMQService.initialize('new_activities_created');
    await this.rabbitMQService.sendMessage(
      JSON.stringify(activityWithDetails),
      'new_activities_created',
    );
    await this.rabbitMQService.closeConnection();

    const emails = [];
    if (course.users && course.users.length > 0) {
      for (const student of course.users) {
        const studentName = `${student.firstName} ${
          student.lastName || ''
        }`.trim();
        const emailResult = await this.emailService.sendMail({
          from: 'noreply@nestapi.com',
          to: student.email,
          html: html(studentName, course.name),
          subject: 'Nova atividade criada',
          text: `Nova atividade ${activity.name} adicionada no curso ${course.name}`,
        });
        emails.push(emailResult);
      }
    }

    return {
      activity: activityWithDetails,
      email_sent_to: emails,
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
