import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto, LoginDto, RefreshTokenDto, GoogleAuthDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } })  // 5 registrations per minute
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto) {
    const tokens = await this.authService.register(registerDto);
    return {
      success: true,
      data: tokens,
      message: 'Registration successful',
    };
  }

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 10 } })  // 10 login attempts per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto) {
    const tokens = await this.authService.login(loginDto.email, loginDto.password, loginDto.recaptchaToken);
    return {
      success: true,
      data: tokens,
      message: 'Login successful',
    };
  }

  @Post('refresh')
  @Throttle({ default: { ttl: 60000, limit: 20 } })  // 20 refresh attempts per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  async refreshTokens(@Body() refreshDto: RefreshTokenDto) {
    const tokens = await this.authService.refreshTokens(
      refreshDto.userId,
      refreshDto.refreshToken,
    );
    return {
      success: true,
      data: tokens,
    };
  }

  @Post('google')
  @Throttle({ default: { ttl: 60000, limit: 10 } })  // 10 Google auth per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login/Register with Google' })
  @ApiBody({ type: GoogleAuthDto })
  async googleAuth(
    @Body() body: GoogleAuthDto,
  ) {
    const tokens = await this.authService.googleLogin(body);
    return {
      success: true,
      data: tokens,
      message: 'Google authentication successful',
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  async logout(@Req() req: any) {
    await this.authService.logout(req.user.sub);
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Req() req: any) {
    const user = await this.authService.getProfile(req.user.sub);
    return {
      success: true,
      data: user,
    };
  }

  @Post('forgot-password')
  @Throttle({ default: { ttl: 60000, limit: 3 } })  // 3 forgot-password requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiBody({ type: ForgotPasswordDto })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email, dto.recaptchaToken);
    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
    };
  }

  @Post('reset-password')
  @Throttle({ default: { ttl: 60000, limit: 5 } })  // 5 reset-password per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword, dto.recaptchaToken);
    return {
      success: true,
      message: 'Password has been successfully reset.',
    };
  }
}
