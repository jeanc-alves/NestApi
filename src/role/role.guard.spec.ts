import { JwtService } from '@nestjs/jwt';
import { RoleGuard } from './role.guard';

describe('RoleGuard', () => {
  it('should be defined', () => {
    const jwtService = new JwtService();
    expect(new RoleGuard(jwtService)).toBeDefined();
  });
});
