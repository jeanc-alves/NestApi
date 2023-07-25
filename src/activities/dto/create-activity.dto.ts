import { IsNotEmpty } from 'class-validator';

export class CreateActivityDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  courseId: number;

  @IsNotEmpty()
  peso: number;
}
