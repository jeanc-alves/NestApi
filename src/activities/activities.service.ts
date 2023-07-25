import { Body, Injectable, Param, UploadedFile } from '@nestjs/common';

import { PrismaService } from 'src/database/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { Activities } from './interfaces';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async create(@Body() data: CreateActivityDto) {
    return this.prisma.activities.create({ data });
  }

  uploadFile(@Param('id') id, @UploadedFile() file: Express.Multer.File) {}

  findAll(data: object) {
    return this.prisma.activities.findMany(data);
  }

  findOne(
    id: number,
    data: { include: object; where: object; select: object },
  ): Promise<Activities> {
    const payload = { where: { id } };

    if (data.include) {
      payload['include'] = data.include;
    }
    if (data.select) {
      payload['select'] = data.select;
    }
    return this.prisma.activities.findUnique(payload);
  }
}
