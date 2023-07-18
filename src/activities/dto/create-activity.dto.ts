import { Course, Files } from '@prisma/client';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateActivityDto {
  id: number;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  courseId: number;

  @IsNotEmpty()
  peso: number;

  file?;
}
