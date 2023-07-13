import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateUserService } from './services/users/create.users.service';
import { Profile, User } from '@prisma/client';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}
  @Get()
  public async getHello() {
    return this.appService.getHello();
  }
}
