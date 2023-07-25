import { IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'email is Required!' })
  email: string;
  @IsNotEmpty({ message: 'Password is Required!' })
  password: string;
}
