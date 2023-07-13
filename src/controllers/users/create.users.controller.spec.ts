import { Test, TestingModule } from '@nestjs/testing';
import { CreateUsersController } from './create.users.controller';

describe('UsersController', () => {
  let controller: CreateUsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreateUsersController],
    }).compile();

    controller = module.get<CreateUsersController>(CreateUsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
