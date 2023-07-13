import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { Profile, User } from '@prisma/client';
import { CreateUserService } from 'src/services/users/create.users.service';

@Controller()
export class CreateUsersController {
  constructor(private createUsersService: CreateUserService) {}
  @Post('users')
  public async store(
    @Body()
    postData: {
      createdAt: Date;
      first_name: string;
      last_name: string;
      avatar: string;
      profile: Profile;
    },
  ): Promise<User> {
    const { createdAt, first_name, last_name, avatar, profile } = postData;
    try {
      return this.createUsersService.handle({
        createdAt,
        first_name,
        last_name,
        avatar,
        profile,
      });
    } catch (error) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
  }
}
