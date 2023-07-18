import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import * as fs from 'fs';

import axios from 'axios';
import { Readable } from 'stream';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(@Request() req, @Body() createUserDto: CreateUserDto) {
    try {
      await this.usersService.verifyPermission(req.user);
      const userCreated = await this.usersService.create(createUserDto);
      return { message: 'User created successfully!', data: userCreated };
    } catch (error) {
      throw new HttpException(error.message, error.status, {
        cause: error,
        description: `${error}`,
      });
    }
  }

  @Get('user/:id')
  async findUser(@Param('id') id) {
    const response = await axios.get(`https://reqres.in/api/users/${id}`);

    return { ...response.data.data };
  }

  @Get('/user/avatar/:id')
  async getUserAvatar(@Param('id') id) {
    const url = `https://reqres.in/api/users/${id}`;
    const response = await axios.get(url, { responseType: 'stream' });
    const response2 = await this.findUser(id);
    const { data: avatarFileBlob } = await axios.get(
      `https://reqres.in/api/users/${id}`,
    );
    const filePath = `/home/jean/Projects/NestApi/nest-api/uṕload/${+new Date()}.jpg`;

    const fileBuffer = await fs.readFileSync(filePath);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.usersService.findOne({ id: +id });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
