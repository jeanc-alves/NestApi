import { Profile } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEnum(Profile)
  @IsOptional()
  profile?: Profile = Profile.ALUNO;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must have at least 6 characters' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsInt()
  @IsOptional()
  courseId?: number;
}
