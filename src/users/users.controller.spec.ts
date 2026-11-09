import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Profile } from '@prisma/client';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { FilesService } from 'src/files/files.service';
import { UserEntity } from './entities/user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let filesService: jest.Mocked<Partial<FilesService>>;

  const mockUser = new UserEntity({
    id: 1,
    createdAt: new Date(),
    firstName: 'Maria',
    email: 'maria@test.com',
    profile: Profile.ALUNO,
  });

  beforeEach(async () => {
    usersService = {
      findAll: jest.fn().mockResolvedValue([mockUser]),
      findOneOrFail: jest.fn().mockResolvedValue(mockUser),
      create: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue(mockUser),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    filesService = {
      uploadFile: jest.fn().mockResolvedValue({ path: '/uploads/avatar.jpg' } as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: FilesService,
          useValue: filesService,
        },
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn() },
        },
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users as UserEntity', async () => {
      const result = await controller.findAll();
      expect(result).toEqual([mockUser]);
      expect(usersService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const result = await controller.findOne('1');
      expect(result).toEqual(mockUser);
      expect(usersService.findOneOrFail).toHaveBeenCalledWith({ id: 1 });
    });
  });
});
