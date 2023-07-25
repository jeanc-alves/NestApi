import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpException,
  UploadedFiles,
  ParseFilePipeBuilder,
  HttpStatus,
  UseInterceptors,
  Patch,
  Res,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

import { AuthGuard } from 'src/auth/auth.guard';
import * as fs from 'fs';

import axios from 'axios';
import * as path from 'path';
import * as appRoot from 'app-root-path';

import { Readable } from 'stream';
import { Response } from 'express';
import { FilesService } from 'src/files/files.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private filesService: FilesService,
  ) {}

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
  @UseGuards(AuthGuard)
  @Get()
  async findAll() {
    return this.usersService.findAll();
  }
  @UseGuards(AuthGuard)
  @Get('user/:id')
  async findUser(@Param('id') id) {
    const response = await axios.get(`https://reqres.in/api/users/${id}`);

    return { ...response.data.data };
  }
  @UseGuards(AuthGuard)
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
  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.usersService.findOne({ id: +id });
  }

  @UseGuards(AuthGuard)
  @Post(':id')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadAvatar(
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: 'jpeg',
        })
        .addMaxSizeValidator({
          maxSize: 1000000,
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    files: Array<Express.Multer.File>,
    @Param('id') id,
    @Request()
    req,
  ): Promise<User> {
    if (!files.length) {
      throw new HttpException('files is required', HttpStatus.BAD_REQUEST);
    }
    const userToUploadAvatar = await this.usersService.findOne({ id: +id });
    const userLogged = req.user;

    if (userLogged.id !== userToUploadAvatar.id) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const avatarFile = files[0];
    const avatarUploaded = await this.filesService.uploadFile(
      avatarFile,
      userLogged.id,
    );

    return this.usersService.update(+id, { avatar: avatarUploaded.path });
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(@Param('id') id, body: UpdateUserDto): Promise<User> {
    return this.usersService.update(id, { ...body });
  }

  @UseGuards(AuthGuard)
  @Get('avatar/:id')
  async getAvatarUser(
    @Param('id') id,
    @Res() res: Response,
    @Query() download: string,
  ): Promise<Response | void> {
    try {
      const user = await this.usersService.findOne({ id: +id });

      if (download) {
        return res.download(user.avatar);
      }
      res.sendFile(user.avatar);
    } catch (error) {
      throw new HttpException(
        'Error when try download avatar file',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
