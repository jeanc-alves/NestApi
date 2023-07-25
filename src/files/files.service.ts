import { Injectable } from '@nestjs/common';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { PrismaService } from 'src/database/prisma.service';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import * as appRoot from 'app-root-path';

import * as fs_extra from 'fs-extra';
import * as archiver from 'archiver';
import { Response } from 'express';
import { UpdateActivityDto } from 'src/activities/dto/update-activity.dto';
import { Files } from 'src/activities/interfaces';
import { File } from './entities/file.entity';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}
  create(createFileDto: CreateFileDto) {
    return this.prisma.files.create({ data: createFileDto });
  }

  async uploadFile(file: Express.Multer.File, userId: number, id?: number) {
    const { buffer: avatarFileBlob } = file;
    const buffer = Buffer.from(avatarFileBlob);

    const readableInstanceStream = new Readable({
      read() {
        this.push(buffer);
        this.push(null);
      },
    });

    const rootPath = path.join(appRoot.path, 'uploads');
    const filePath = `${rootPath}/${file.originalname}`;

    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filePath);
      readableInstanceStream.pipe(writer);

      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    const fileCreated = await this.create({
      name: file.originalname,
      path: filePath,
      size: file.size,
      ext: file.originalname.split('.')[1],
      activityId: id,
      userId: userId,
    });

    return fileCreated;
  }

  async uploadMultipleFiles(
    files: Array<Express.Multer.File>,
    activityId: number,
    userId: number,
  ) {
    const filesCreated = [];
    for (const file of files) {
      const { buffer: avatarFileBlob } = file;
      const buffer = Buffer.from(avatarFileBlob);

      const readableInstanceStream = new Readable({
        read() {
          this.push(buffer);
          this.push(null);
        },
      });

      const rootPath = path.join(appRoot.path, 'uploads');
      const filePath = `${rootPath}/${file.originalname}`;

      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        readableInstanceStream.pipe(writer);

        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      const fileCreated = await this.create({
        name: file.originalname,
        path: filePath,
        size: file.size,
        ext: file.originalname.split('.')[1],
        activityId,
        userId: userId,
      });
      filesCreated.push(fileCreated);
    }
    return filesCreated;
  }

  const;

  async downloadZipFiles(activity, res: Response) {
    try {
      const files = activity.files;

      if (files.length === 0) {
        res.status(404).send('No files found');
        return;
      }

      const zipFilePath = path.join(appRoot.path, 'tmp');

      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        res.download(zipFilePath, 'pdfs.zip', () => {
          fs_extra.removeSync(zipFilePath);
        });
      });

      archive.on('error', (err: any) => {
        res.status(500).send('Error creating the zip file');
      });

      archive.pipe(output);

      for (const file of files) {
        const pdfPath = file.path;

        archive.append(fs.createReadStream(pdfPath), { name: file.name });
      }

      archive.finalize();
    } catch (err) {
      res.status(500).send('Error fetching the files');
    }
  }

  async findAll(): Promise<File[]> {
    return this.prisma.files.findMany();
  }

  async findOne(id: number): Promise<File> {
    return this.prisma.files.findUnique({ where: { id: +id } });
  }

  async update(id: number, updateFileDto: UpdateFileDto): Promise<File> {
    const { activityId, ext, name, size, userId, path } = updateFileDto;
    return this.prisma.files.update({
      where: { id },
      data: { activityId, ext, name, size, userId, path },
    });
  }

  async remove(id: number) {
    return `This action removes a #${id} file`;
  }
}
