import { Profile, User } from '@prisma/client';
import { IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  id?: number;
  createdAt: Date;
  @IsNotEmpty({ message: 'Primeiro nome é obrigátorio' })
  first_name: string;
  second_name: string;
  profile: Profile;
  avatar: string;
}
