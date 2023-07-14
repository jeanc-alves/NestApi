import { IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Username is Required!' })
  username: string;
  @IsNotEmpty({ message: 'Password is Required!' })
  password: string;
}
