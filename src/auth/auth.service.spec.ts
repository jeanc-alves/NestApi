import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Profile } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { UserEntity } from 'src/users/entities/user.entity';

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  let usersService: jest.Mocked<Partial<UsersService>>;

  const mockUser = {
    id: 1,
    createdAt: new Date(),
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'hashed_password',
    profile: Profile.ALUNO,
    avatar: null,
    courseId: null,
  };

  beforeEach(async () => {
    usersService = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mocked_jwt_token'),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('signIn', () => {
    it('should return token and user without exposing password in response or payload', async () => {
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      usersService.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.signIn('test@example.com', 'secret123');

      expect(result.access_token).toBe('mocked_jwt_token');
      expect(result.user).toBeInstanceOf(UserEntity);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 1,
        email: 'test@example.com',
        profile: Profile.ALUNO,
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      usersService.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        authService.signIn('notfound@example.com', 'secret123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));
      usersService.findOne = jest.fn().mockResolvedValue(mockUser);

      await expect(
        authService.signIn('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should throw ConflictException if email is already taken', async () => {
      usersService.findOne = jest.fn().mockResolvedValue(mockUser);

      await expect(
        authService.register({
          firstName: 'New',
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create and return UserEntity when email is available', async () => {
      usersService.findOne = jest.fn().mockResolvedValue(null);
      usersService.create = jest
        .fn()
        .mockResolvedValue(new UserEntity(mockUser));

      const result = await authService.register({
        firstName: 'New',
        email: 'new@example.com',
        password: 'password123',
      });

      expect(result).toBeInstanceOf(UserEntity);
      expect(usersService.create).toHaveBeenCalled();
    });
  });
});
