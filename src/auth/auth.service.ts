import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UserEntity } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, password: string) {
    const user = await this.usersService.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      profile: user.profile,
    };

    const access_token = await this.jwtService.signAsync(payload);
    return {
      access_token,
      user: new UserEntity(user),
    };
  }

  async register(data: CreateUserDto) {
    const exists = await this.usersService.findOne({ email: data.email });
    if (exists) {
      throw new ConflictException('Email already registered');
    }
    const newUser = await this.usersService.create(data);
    return new UserEntity(newUser);
  }
}
