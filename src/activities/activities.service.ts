import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { Activities } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResultDto } from 'src/common/dto/paginated-result.dto';

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

  async findAllPaginated(
    pagination?: PaginationQueryDto,
  ): Promise<PaginatedResultDto<Activities>> {
    const page = Number(pagination?.page) || 1;
    const limit = Number(pagination?.limit) || 10;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.activities.count(),
      this.prisma.activities.findMany({
        skip,
        take: limit,
        include: { files: true, course: true },
        orderBy: { id: 'asc' },
      }),
    ]);

    return new PaginatedResultDto(items, total, page, limit);
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
