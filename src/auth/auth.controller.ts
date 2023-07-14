import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @HttpCode(200)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const c = await this.authService.signIn(
      loginDto.username,
      loginDto.password,
    );
    return c;
  }
}
