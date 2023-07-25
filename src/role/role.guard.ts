import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import { jwtConstants } from 'src/auth/constants';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }

    const payload = await this.jwtService.verifyAsync(token, {
      secret: jwtConstants.secret,
    });
    // 💡 We're assigning the payload to the request object here
    // so that we can access it in our route handlers
    request['user'] = payload;
    const profile_to_created = request.body.profile;
    const profile = request.user.profile;

    if (profile_to_created === 'ADMIN' && profile !== 'ADMIN') {
      throw new HttpException(
        'Unathorized action only permisioned to ADMIN',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (!profile_to_created && profile !== 'ADMIN')
      throw new HttpException(
        'Unathorized action only permisioned to ADMIN',
        HttpStatus.UNAUTHORIZED,
      );

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
