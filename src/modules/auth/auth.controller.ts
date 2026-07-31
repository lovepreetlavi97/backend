import { Controller, Post, Body } from '@nestjs/common';
import { AuthService, RegisterUserDto, LoginUserDto } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterUserDto) {
    const result = await this.authService.register(dto);
    return {
      status: 'success',
      message: 'User registered successfully.',
      data: result,
    };
  }

  @Post('login')
  async login(@Body() dto: LoginUserDto) {
    const result = await this.authService.login(dto);
    return {
      status: 'success',
      message: 'Login successful.',
      data: result,
    };
  }
}
