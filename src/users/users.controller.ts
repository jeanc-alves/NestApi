import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ParseFilePipeBuilder,
  HttpStatus,
  UseInterceptors,
  Patch,
  Delete,
  Res,
  Query,
  ClassSerializerInterceptor,
  UploadedFiles,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Profile } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { AuthGuard } from 'src/auth/auth.guard';
import { RoleGuard } from 'src/role/role.guard';
import { Roles } from 'src/role/roles.decorator';
import { FilesService } from 'src/files/files.service';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
  ) {}

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Profile.ADMIN)
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAll(): Promise<UserEntity[]> {
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserEntity> {
    return this.usersService.findOneOrFail({ id: Number(id) });
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    const targetId = Number(id);
    if (req.user.sub !== targetId && req.user.profile !== Profile.ADMIN) {
      throw new ForbiddenException('Cannot update another user profile');
    }
    return this.usersService.update(targetId, updateUserDto);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Profile.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.usersService.remove(Number(id));
    return { message: 'User deleted successfully' };
  }

  @UseGuards(AuthGuard)
  @Post(':id/avatar')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadAvatar(
    @Request() req,
    @Param('id') id: string,
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /(jpeg|jpg|png)$/ })
        .addMaxSizeValidator({ maxSize: 2000000 })
        .build({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    files: Array<Express.Multer.File>,
  ): Promise<UserEntity> {
    const targetId = Number(id);
    if (req.user.sub !== targetId && req.user.profile !== Profile.ADMIN) {
      throw new ForbiddenException('Cannot upload avatar for another user');
    }
    if (!files || files.length === 0) {
      throw new BadRequestException('Avatar file is required');
    }

    const uploaded = await this.filesService.uploadFile(files[0], targetId);
    return this.usersService.update(targetId, { avatar: uploaded.path });
  }

  @UseGuards(AuthGuard)
  @Get(':id/avatar')
  async getAvatar(
    @Param('id') id: string,
    @Res() res: Response,
    @Query('download') download?: string,
  ): Promise<void> {
    const user = await this.usersService.findOneOrFail({ id: Number(id) });
    if (!user.avatar) {
      throw new NotFoundException('Avatar not found');
    }
    if (download) {
      return res.download(user.avatar);
    }
    return res.sendFile(user.avatar);
  }
}
