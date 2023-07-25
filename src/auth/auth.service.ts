import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, password: string) {
    const user = await this.usersService.findOne({ email });
    if (!user) {
      throw new HttpException('Invalid credential!', HttpStatus.UNAUTHORIZED);
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new HttpException('Invalid credential!', HttpStatus.UNAUTHORIZED);
    }

    const access_token = await this.jwtService.signAsync(
      JSON.stringify({ ...user }),
      {
        secret: jwtConstants.secret,
      },
    );
    return { access_token, user };
  }

  async register(data: CreateUserDto) {
    try {
      const exists = await this.usersService.findOne({ email: data.email });
      if (exists) {
        throw new HttpException(
          'Email already registred!',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      const new_user = await this.usersService.create(data);
      return new_user;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}
