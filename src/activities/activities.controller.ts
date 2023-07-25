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
  HttpException,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';

import { html } from '../resources/ActivitiesCreatedEmail';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { FilesService } from 'src/files/files.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { RabbitMQService } from 'src/rabbittmq/rabbittmq.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { EmailService } from 'src/email/email.service';
import { CoursesService } from 'src/courses/courses.service';

import { IResponseCreateActivities } from './interfaces';
import { RoleGuard } from 'src/role/role.guard';

@Controller('activities')
export class ActivitiesController {
  constructor(
    private activitiesService: ActivitiesService,
    private filesService: FilesService,
    private rabbitMQService: RabbitMQService,
    private emailService: EmailService,
    private courseService: CoursesService,
  ) {}
  @UseGuards(RoleGuard)
  @UseGuards(AuthGuard)
  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: 'pdf',
        })
        .addMaxSizeValidator({
          maxSize: 50000000,
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    files: Array<Express.Multer.File>,
    @Body()
    body: CreateActivityDto,
    @Request() req,
  ): Promise<IResponseCreateActivities> {
    const { name, courseId, peso } = body;
    const course = await this.courseService.findOne(+courseId);

    if (!course) {
      throw new HttpException('Course Not Found', HttpStatus.NOT_FOUND);
    }
    const activity = await this.activitiesService.create({
      name,
      courseId: +courseId,
      peso: +peso,
    });

    let fileCreatead;

    if (files.length) {
      fileCreatead = await this.filesService.uploadMultipleFiles(
        files,
        activity.id,
        req.user.id,
      );
    }

    const activityReload = await this.findOne(activity.id, {
      include: {
        files: true,
        course: { include: { users: true } },
      },
    });

    await this.rabbitMQService.initialize('new_activities_created');

    await this.rabbitMQService.sendMessage(
      JSON.stringify({ ...activityReload }),
      'new_activities_created',
    );

    await this.rabbitMQService.closeConnection();

    const emails = [];
    try {
      for (const user of activityReload.course.users) {
        const email = await this.emailService.sendMail({
          from: 'email@test.com',
          to: user.email,
          html: html(
            `${user.firstName} ${
              user.secondName !== '' ? user.secondName : ''
            }`,
            `${activityReload.course.name}`,
          ),
          subject: 'Atividade nova Criada',
          text: `segue a nova atividade`,
        });
        emails.push(email);
      }

      return {
        activity: activityReload,
        email_sent_to: emails,
        files: fileCreatead,
      };
    } catch (error) {
      throw new HttpException('Error to send Email', HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async findAll(data) {
    return this.activitiesService.findAll(data);
  }

  @Get(':id')
  async findOne(@Param('id') id: number, data) {
    return this.activitiesService.findOne(+id, data);
  }

  @Get(':id/download-files')
  async downloadFiles(@Param('id') id: number, @Res() res) {
    const activity = await this.activitiesService.findOne(+id, {
      include: { files: true, course: true },
      where: { id: +id },
      select: { files: true },
    });

    return this.filesService.downloadZipFiles(activity, res);
  }
}
