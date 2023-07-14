import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(username: string, password: string): Promise<any> {
    const user = await this.usersService.findOne({ username });

    if (!user) {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }

    const access_token = await this.jwtService.signAsync(
      JSON.stringify({ ...user }),
      {
        secret: 'SECRET EXTREME CONFIDENTIAL',
      },
    );
    return { access_token, user };
  }
}
