import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNext: boolean;

  @ApiProperty({ example: false })
  hasPrev: boolean;
}

export class PaginatedResultDto<T> {
  items: T[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;

  constructor(items: T[], total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit) || 1;
    this.items = items;
    this.meta = {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }
}
