import { Course, Profile, User } from '@prisma/client';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {
  createdAt: Date;
  @IsNotEmpty({ message: 'First name is Required!' })
  firstName: string;

  second_name?: string;
  profile?: Profile;

  avatar?: string;

  @IsNotEmpty({ message: 'Username is Required!' })
  username: string;

  @IsNotEmpty({ message: 'Password is Required!' })
  password: string;

  @IsOptional()
  course;
}
