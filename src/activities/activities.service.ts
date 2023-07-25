import { Body, Injectable } from '@nestjs/common';

import { PrismaService } from 'src/database/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { Activities } from './interfaces';
import { Prisma } from '@prisma/client';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async create(@Body() data: CreateActivityDto) {
    const { courseId, name, peso } = data;
    return this.prisma.activities.create({
      data: { courseId, name, peso },
    });
  }

  async findAll(data: object) {
    return this.prisma.activities.findMany(data);
  }

  async findOne(
    id: number,
    data: {
      include: Prisma.ActivitiesInclude;
      select: Prisma.ActivitiesSelect;
      where: { id?: number; email?: string };
    },
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
