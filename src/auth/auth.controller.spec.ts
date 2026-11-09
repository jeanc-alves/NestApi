import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserEntity } from 'src/users/entities/user.entity';
import { Profile } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Partial<AuthService>>;

  const mockUser = new UserEntity({
    id: 1,
    createdAt: new Date(),
    firstName: 'Jean',
    email: 'jean@test.com',
    profile: Profile.ADMIN,
  });

  beforeEach(async () => {
    authService = {
      signIn: jest.fn().mockResolvedValue({
        access_token: 'valid_jwt_token',
        user: mockUser,
      }),
      register: jest.fn().mockResolvedValue(mockUser),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return token and user', async () => {
      const result = await controller.login({
        email: 'jean@test.com',
        password: 'password123',
      });

      expect(result).toEqual({
        access_token: 'valid_jwt_token',
        user: mockUser,
      });
      expect(authService.signIn).toHaveBeenCalledWith('jean@test.com', 'password123');
    });
  });

  describe('register', () => {
    it('should call register and return user', async () => {
      const result = await controller.register({
        firstName: 'Jean',
        email: 'jean@test.com',
        password: 'password123',
      });

      expect(result).toEqual(mockUser);
      expect(authService.register).toHaveBeenCalled();
    });
  });
});
