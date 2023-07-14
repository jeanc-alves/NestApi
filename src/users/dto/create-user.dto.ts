import { Profile, User } from '@prisma/client';
import { IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  id?: number;
  createdAt: Date;
  @IsNotEmpty({ message: 'First name is Required!' })
  first_name: string;

  second_name?: string;
  profile?: Profile;

  avatar?: string;

  @IsNotEmpty({ message: 'Username is Required!' })
  username: string;

  @IsNotEmpty({ message: 'Password is Required!' })
  password: string;
}
