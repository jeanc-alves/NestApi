import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@ApiTags('Files')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @ApiOperation({ summary: 'Create file metadata' })
  @ApiResponse({ status: 201, description: 'File metadata created' })
  @Post()
  create(@Body() createFileDto: CreateFileDto) {
    return this.filesService.create(createFileDto);
  }

  @ApiOperation({ summary: 'Download multiple files as ZIP by comma-separated IDs' })
  @ApiResponse({ status: 200, description: 'ZIP file stream' })
  @Get(':ids')
  async downloadFiles(@Param('ids') ids: string, @Res() res): Promise<void> {
    const fileIds = ids.split(',').map((id) => parseInt(id, 10));
    try {
      await this.filesService.downloadZipFiles(fileIds, res);
    } catch (error) {
      throw new HttpException('Download zipfiles Failed', HttpStatus.FORBIDDEN);
    }
  }

  @ApiOperation({ summary: 'List all files' })
  @ApiResponse({ status: 200, description: 'List of files' })
  @Get()
  findAll() {
    return this.filesService.findAll();
  }

  @ApiOperation({ summary: 'Find file metadata by ID' })
  @ApiResponse({ status: 200, description: 'File details' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.filesService.findOne(+id);
  }

  @ApiOperation({ summary: 'Update file metadata' })
  @ApiResponse({ status: 200, description: 'File updated' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFileDto: UpdateFileDto) {
    return this.filesService.update(+id, updateFileDto);
  }

  @ApiOperation({ summary: 'Delete file by ID' })
  @ApiResponse({ status: 200, description: 'File deleted' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.filesService.remove(+id);
  }
}
