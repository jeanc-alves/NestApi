import { Course } from '@prisma/client';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateActivityDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  courseId: number;

  @IsNotEmpty()
  peso: number;

  @IsOptional()
  course?: Course;

  @IsOptional()
  files?: File[];
}
