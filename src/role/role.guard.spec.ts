import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Profile } from '@prisma/client';
import { RoleGuard } from './role.guard';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    guard = new RoleGuard(reflector);
  });

  const createMockContext = (user: unknown): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({ profile: Profile.ALUNO });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has the required ADMIN role', () => {
    reflector.getAllAndOverride.mockReturnValue([Profile.ADMIN]);
    const context = createMockContext({ profile: Profile.ADMIN });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when user has ALUNO profile and route requires ADMIN', () => {
    reflector.getAllAndOverride.mockReturnValue([Profile.ADMIN]);
    const context = createMockContext({ profile: Profile.ALUNO });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user is not present on request', () => {
    reflector.getAllAndOverride.mockReturnValue([Profile.ADMIN]);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
