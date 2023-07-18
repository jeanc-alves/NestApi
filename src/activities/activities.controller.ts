import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Request,
  UseGuards,
  UploadedFiles,
  ParseFilePipeBuilder,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';

import { UpdateActivityDto } from './dto/update-activity.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { FilesService } from 'src/files/files.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { RabbitMQService } from 'src/rabbittmq/rabbittmq.service';

@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private filesService: FilesService,
    private rabbitMQService: RabbitMQService,
  ) {}

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
    body,
    @Request() req,
  ) {
    const { name, courseId, peso } = body;

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
      include: { files: true },
    });

    await this.rabbitMQService.sendMessage(
      JSON.stringify({ ...activityReload }),
    );

    return { activity, files: fileCreatead };
  }

  @Get()
  async findAll(data) {
    return this.activitiesService.findAll(data);
  }

  @Get(':id')
  findOne(@Param('id') id: number, data) {
    return this.activitiesService.findOne(+id, data);
  }

  @Get(':id/download-files')
  async downloadFiles(@Param('id') id: number, @Res() res: Response) {
    const activity = await this.activitiesService.findOne(+id, {
      include: { files: true, course: true },
      where: { id: +id },
      select: { files: true },
    });

    return this.filesService.downloadZipFiles(activity, res);
  }
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateActivityDto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(+id, updateActivityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activitiesService.remove(+id);
  }
}
