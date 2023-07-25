import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
enum Profile {
  ALUNO,
  ADMIN,
}
export class CreateUserDto {
  createdAt?: Date;
  @IsNotEmpty({ message: 'First name is Required!' })
  firstName: string;

  second_name?: string;
  profile?: Profile;

  avatar?: string;
  @IsEmail()
  @IsNotEmpty({ message: 'Email is Required!' })
  email: string;

  @IsNotEmpty({ message: 'Password is Required!' })
  password: string;

  @IsOptional()
  courseId?: number;
}
