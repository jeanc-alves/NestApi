import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { Activities } from '@prisma/client';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateActivityDto): Promise<Activities> {
    const { courseId, name, peso } = data;
    return this.prisma.activities.create({
      data: { courseId, name, peso },
    });
  }

  async findAll(): Promise<Activities[]> {
    return this.prisma.activities.findMany({
      include: { files: true, course: true },
    });
  }

  async findOne(id: number): Promise<Activities | null> {
    return this.prisma.activities.findUnique({
      where: { id },
      include: { files: true, course: true },
    });
  }

  async findOneOrFail(id: number): Promise<Activities> {
    const activity = await this.findOne(id);
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }
    return activity;
  }
}
