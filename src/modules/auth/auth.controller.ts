import { Controller, Post, Body, Res, Req, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService, RegisterUserDto, LoginUserDto } from './auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new customer account' })
  async register(@Body() dto: RegisterUserDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      status: 'success',
      message: 'User registered successfully.',
      data: result,
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user and set HTTP-only authentication cookies' })
  async login(@Body() dto: LoginUserDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      status: 'success',
      message: 'Login successful.',
      data: result,
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using HTTP-only refresh cookie' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const result = await this.authService.refreshToken(refreshToken);

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    return {
      status: 'success',
      data: result,
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout and clear HTTP-only session cookies' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    const accessToken = req.cookies?.accessToken || req.headers.authorization?.substring(7);

    await this.authService.logout(refreshToken, accessToken);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return {
      status: 'success',
      message: 'Logged out successfully.',
    };
  }
}
