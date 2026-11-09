import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Profile } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { PrismaService } from 'src/database/prisma.service';
import { UserEntity } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: jest.Mocked<Partial<PrismaService>>;

  const mockUser = {
    id: 1,
    createdAt: new Date(),
    firstName: 'Alice',
    lastName: 'Silva',
    avatar: null,
    profile: Profile.ALUNO,
    email: 'alice@test.com',
    password: 'hashed_password_123',
    courseId: 10,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should hash password and return UserEntity', async () => {
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashed_abc'));
      (prisma.user.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: 'hashed_abc',
      });

      const result = await service.create({
        firstName: 'Alice',
        email: 'alice@test.com',
        password: 'raw_password',
      });

      expect(result).toBeInstanceOf(UserEntity);
      expect(prisma.user.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return array of UserEntity', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(UserEntity);
    });
  });

  describe('findOneOrFail', () => {
    it('should return UserEntity when found by id', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findOneOrFail({ id: 1 });

      expect(result).toBeInstanceOf(UserEntity);
      expect(result.email).toBe('alice@test.com');
    });

    it('should throw NotFoundException when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOneOrFail({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update user and hash new password if provided', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('new_hashed_pwd'));
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        firstName: 'Alice Updated',
      });

      const result = await service.update(1, {
        firstName: 'Alice Updated',
        password: 'new_password',
      });

      expect(result).toBeInstanceOf(UserEntity);
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete user when found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.delete as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.remove(1)).resolves.toBeUndefined();
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
