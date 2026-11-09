import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import * as appRoot from 'app-root-path';
import * as archiver from 'archiver';
import { Response } from 'express';
import { PrismaService } from 'src/database/prisma.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { File } from './entities/file.entity';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  validateMagicNumber(buffer: Buffer, expectedType: 'pdf' | 'image' | 'any'): void {
    if (!buffer || buffer.length < 4) {
      throw new BadRequestException('File buffer is empty or corrupted');
    }

    if (expectedType === 'pdf') {
      const isPdf =
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46;
      if (!isPdf) {
        throw new BadRequestException('Invalid PDF file content');
      }
    } else if (expectedType === 'image') {
      const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      const isPng =
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47;
      if (!isJpeg && !isPng) {
        throw new BadRequestException('Invalid image file content');
      }
    }
  }

  create(createFileDto: CreateFileDto) {
    return this.prisma.files.create({ data: createFileDto });
  }

  async uploadFile(file: Express.Multer.File, userId: number, id?: number) {
    if (!file || !file.buffer) {
      throw new BadRequestException('File is required');
    }

    const buffer = Buffer.from(file.buffer);
    const originalExt = path.extname(file.originalname).toLowerCase().replace('.', '');
    const isImage = ['jpg', 'jpeg', 'png'].includes(originalExt);
    const isPdf = originalExt === 'pdf';

    if (isPdf) {
      this.validateMagicNumber(buffer, 'pdf');
    } else if (isImage) {
      this.validateMagicNumber(buffer, 'image');
    }

    const rootPath = path.join(appRoot.path, 'uploads');
    if (!fs.existsSync(rootPath)) {
      fs.mkdirSync(rootPath, { recursive: true });
    }

    const safeExt = originalExt ? `.${originalExt}` : '';
    const safeStorageName = `${randomUUID()}${safeExt}`;
    const filePath = path.join(rootPath, safeStorageName);

    await fs.promises.writeFile(filePath, buffer);

    return this.create({
      name: path.basename(file.originalname),
      path: filePath,
      size: file.size,
      ext: originalExt,
      activityId: id,
      userId,
    });
  }

  async uploadMultipleFiles(
    files: Array<Express.Multer.File>,
    activityId: number,
    userId: number,
  ) {
    if (!files || files.length === 0) {
      return [];
    }

    const filesCreated = [];
    for (const file of files) {
      const created = await this.uploadFile(file, userId, activityId);
      filesCreated.push(created);
    }
    return filesCreated;
  }

  async downloadZipFiles(activityOrIds: any, res: Response): Promise<void> {
    let files: Array<{ name: string; path: string }> = [];

    if (Array.isArray(activityOrIds)) {
      const foundFiles = await this.prisma.files.findMany({
        where: { id: { in: activityOrIds } },
      });
      files = foundFiles;
    } else if (activityOrIds?.files) {
      files = activityOrIds.files;
    }

    if (!files || files.length === 0) {
      res.status(404).json({ statusCode: 404, message: 'No files found' });
      return;
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="archive.zip"');

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err: any) => {
      if (!res.headersSent) {
        res.status(500).json({ message: err.message });
      }
    });

    archive.pipe(res);

    for (const file of files) {
      if (file.path && fs.existsSync(file.path)) {
        archive.append(fs.createReadStream(file.path), { name: file.name });
      }
    }

    await archive.finalize();
  }

  async findAll(): Promise<File[]> {
    return this.prisma.files.findMany();
  }

  async findOne(id: number): Promise<File> {
    const file = await this.prisma.files.findUnique({ where: { id } });
    if (!file) {
      throw new NotFoundException('File not found');
    }
    return file;
  }

  async update(id: number, updateFileDto: UpdateFileDto): Promise<File> {
    const { activityId, ext, name, size, userId, path: filePath } = updateFileDto;
    return this.prisma.files.update({
      where: { id },
      data: { activityId, ext, name, size, userId, path: filePath },
    });
  }

  async remove(id: number) {
    await this.prisma.files.delete({ where: { id } });
    return `This action removes a #${id} file`;
  }
}
