import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

// 20 auth requests per 15 minutes per IP — blocks brute force, allows normal use
@Throttle({ auth: { ttl: 15 * 60_000, limit: 20 } })
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto.email, dto.password);
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, role: result.role };
  }

  @Post('refresh')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = (req.cookies as any)?.['refresh_token'];
    if (!token) {
      res.status(HttpStatus.UNAUTHORIZED).json({ message: 'No refresh token' });
      return;
    }
    const result = await this.auth.refresh(token);
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, role: result.role };
  }

  @Post('logout')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = (req.cookies as any)?.['refresh_token'];
    if (token) await this.auth.logout(token);
    res.clearCookie('refresh_token');
    return { success: true };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.auth.forgotPassword(dto.email);
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto.token, dto.newPassword);
    return { success: true };
  }

  /** Public — check if email needs setup (pendingSetup=true) */
  @Post('check-email')
  @HttpCode(HttpStatus.OK)
  async checkEmail(@Body() body: { email: string }) {
    return this.auth.checkEmail(body.email);
  }

  /** Public — complete account setup: set password, return tokens */
  @Post('complete-setup')
  @HttpCode(HttpStatus.OK)
  async completeSetup(
    @Body() body: { email: string; newPassword: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.completeSetup(body.email, body.newPassword);
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, role: result.role };
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }
}
