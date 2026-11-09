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
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
  ) {}

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(Profile.ADMIN)
  @ApiOperation({ summary: 'Create user manually (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-admin' })
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'List of users with passwords omitted' })
  @Get()
  async findAll(): Promise<UserEntity[]> {
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiResponse({ status: 200, description: 'User profile details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserEntity> {
    return this.usersService.findOneOrFail({ id: Number(id) });
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update user profile (Self or Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 403, description: 'Cannot update another user' })
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
  @ApiOperation({ summary: 'Delete user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.usersService.remove(Number(id));
    return { message: 'User deleted successfully' };
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Upload avatar image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Avatar uploaded and profile updated' })
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
  @ApiOperation({ summary: 'Retrieve or download user avatar image' })
  @ApiResponse({ status: 200, description: 'Avatar binary file' })
  @ApiResponse({ status: 404, description: 'Avatar not found' })
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
