import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { PrismaService } from './database/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  const mockPrisma = {
    user: {
      findFirst: jest.fn().mockResolvedValue({ id: 1, email: 'admin@nest.com' }),
    },
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return user from prisma findFirst', async () => {
      const result = await appController.getHello();
      expect(result).toEqual({ id: 1, email: 'admin@nest.com' });
    });
  });
});
