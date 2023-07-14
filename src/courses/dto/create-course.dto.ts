import { IsNotEmpty } from 'class-validator';

export class CreateCourseDto {
  id?: number;
  @IsNotEmpty({ message: 'Name is required!' })
  name: string;
  @IsNotEmpty({ message: 'Sector is required!' })
  sector: string;
  @IsNotEmpty({ message: 'Duration is required!' })
  duration: number;
}
