import { Body, Injectable, Param, UploadedFile } from '@nestjs/common';

import { UpdateActivityDto } from './dto/update-activity.dto';
import { PrismaService } from 'src/database/prisma.service';
import { RabbitMQService } from 'src/rabbittmq/rabbittmq.service';

@Injectable()
export class ActivitiesService {
  constructor(
    private prisma: PrismaService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async create(@Body() data) {
    return this.prisma.activities.create({ data });
  }

  uploadFile(@Param('id') id, @UploadedFile() file: Express.Multer.File) {}

  findAll(data) {
    return this.prisma.activities.findMany(data);
  }

  findOne(id, data) {
    const payload = { where: { id } };

    if (data.include) {
      payload['include'] = data.include;
    }
    return this.prisma.activities.findUnique(payload);
  }

  update(id: number, updateActivityDto: UpdateActivityDto) {
    return `This action updates a #${id} activity`;
  }

  remove(id: number) {
    return `This action removes a #${id} activity`;
  }
}
