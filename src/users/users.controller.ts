import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

import { AuthGuard } from 'src/auth/auth.guard';
import * as fs from 'fs';

import axios from 'axios';
import * as path from 'path';
import * as appRoot from 'app-root-path';

import { Readable, Stream } from 'stream';

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

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('user/:id')
  async findUser(@Param('id') id) {
    const response = await axios.get(`https://reqres.in/api/users/${id}`);

    return { ...response.data.data };
  }

  @Get('/user/avatar/:id')
  async getUserAvatar(@Param('id') id) {
    const { avatar } = await this.findUser(id);
    const { data } = await axios.get(avatar);

    const rootPath = path.join(appRoot.path, `uploads/${+new Date()}`);
    const buffer = Buffer.from(data);
    const readableInstanceStream = new Readable({
      read() {
        this.push(buffer);
        this.push(null);
      },
    });

    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(rootPath);

      readableInstanceStream.pipe(writer);

      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.usersService.findOne({ id: +id });
  }
}
