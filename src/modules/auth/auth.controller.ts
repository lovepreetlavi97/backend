import { Controller, Post, Body, Res, Req, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  AuthService,
  RegisterUserDto,
  LoginUserDto,
  PhoneOtpDto,
  VerifyOtpDto,
} from './auth.service';

@ApiTags('Authentication')
@Controller(['auth', 'user'])
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post(['login/phone', 'phone-login'])
  @ApiOperation({ summary: 'Request OTP for phone login/verification' })
  async requestPhoneOtp(@Body() dto: PhoneOtpDto) {
    const result = await this.authService.requestPhoneOtp(dto);
    return {
      status: 'success',
      message: 'OTP sent successfully.',
      userRegistered: result.userRegistered,
      data: result,
    };
  }

  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend OTP to phone number' })
  async resendPhoneOtp(@Body() dto: PhoneOtpDto) {
    const result = await this.authService.resendPhoneOtp(dto);
    return {
      status: 'success',
      message: 'OTP resent successfully.',
      userRegistered: result.userRegistered,
      data: result,
    };
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP and authenticate user' })
  async verifyPhoneOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyPhoneOtp(dto);

    if (result.accessToken) {
      res.cookie('authToken', result.accessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });
    }

    if (result.refreshToken) {
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return {
      status: 'success',
      message: 'OTP verified successfully.',
      user: result.user,
      token: result.token,
      data: result,
    };
  }

  @Post(['register', ''])
  @ApiOperation({ summary: 'Register a new customer account' })
  async register(@Body() dto: RegisterUserDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);

    res.cookie('authToken', result.accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

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
      user: result.user,
      token: result.token,
      data: result,
    };
  }

  @Post(['login', 'login/email'])
  @ApiOperation({ summary: 'Login user with email/password and set HTTP-only cookies' })
  async login(@Body() dto: LoginUserDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);

    res.cookie('authToken', result.accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

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
      user: result.user,
      token: result.token,
      data: result,
    };
  }

  @Post('login/google')
  @ApiOperation({ summary: 'Login user with Google account' })
  async googleLogin(
    @Body() dto: { code: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.googleLogin(dto.code);

    res.cookie('authToken', result.accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

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
      message: 'Google login successful.',
      user: result.user,
      token: result.token,
      data: result,
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using HTTP-only refresh cookie' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const result = await this.authService.refreshToken(refreshToken);

    res.cookie('authToken', result.accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

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

    res.clearCookie('authToken');
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return {
      status: 'success',
      message: 'Logged out successfully.',
    };
  }
}

