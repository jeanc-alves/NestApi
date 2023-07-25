import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOne({ email });
    if (!user) {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
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

  async register(data: CreateUserDto): Promise<User> {
    try {
      const new_user = await this.usersService.create({ ...data });
      return new_user;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}
