import { Controller, Get, Param } from '@nestjs/common';
import { ListUsersService } from 'src/services/users/list-users/list-users.service';

@Controller('users')
export class ListUsersController {
  constructor(private listUsersService: ListUsersService) {}
  @Get()
  public async listAllUsers(@Param() params) {
    console.log('params: ', params);
    return this.listUsersService.handle({ ...params });
  }
}
