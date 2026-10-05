import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../../database/entities/user.entity';
import { EmailService } from '../email/email.service';

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async register(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    recaptchaToken: string;
  }): Promise<AuthTokens> {
    await this.verifyCaptcha(data.recaptchaToken);
    const existingUser = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = this.userRepository.create({
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      phone: data.phone,
      role: 'user',
    });

    const savedUser = await this.userRepository.save(user);
    const tokens = await this.generateTokens(savedUser);
    await this.updateRefreshToken(savedUser.id, tokens.refreshToken);

    return tokens;
  }

  async login(email: string, password: string, recaptchaToken: string): Promise<AuthTokens> {
    await this.verifyCaptcha(recaptchaToken);
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'passwordHash', 'role', 'isActive', 'fullName'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'passwordHash', 'role', 'isActive', 'fullName'],
    });

    if (user && user.isActive) {
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (isPasswordValid) {
        return user;
      }
    }

    return null;
  }

  async googleLogin(googleUser: {
    email: string;
    fullName: string;
    googleId: string;
    avatarUrl?: string;
  }): Promise<AuthTokens> {
    let user = await this.userRepository.findOne({
      where: { email: googleUser.email },
    });

    if (!user) {
      user = this.userRepository.create({
        email: googleUser.email,
        fullName: googleUser.fullName,
        googleId: googleUser.googleId,
        avatarUrl: googleUser.avatarUrl,
        isVerified: true,
        role: 'user',
      });
      user = await this.userRepository.save(user);
    } else if (!user.googleId) {
      user.googleId = googleUser.googleId;
      if (googleUser.avatarUrl) user.avatarUrl = googleUser.avatarUrl;
      user = await this.userRepository.save(user);
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<AuthTokens> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'role', 'refreshToken', 'isActive'],
    });

    if (!user || !user.refreshToken || !user.isActive) {
      throw new UnauthorizedException('Access denied');
    }

    const isRefreshValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isRefreshValid) {
      throw new UnauthorizedException('Access denied');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.update(userId, { refreshToken: null as any });
  }

  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id', 'email', 'fullName', 'avatarUrl', 'role',
        'phone', 'organizationId', 'reputationPoints',
        'isVerified', 'isActive', 'preferences',
        'googleId', 'createdAt', 'updatedAt',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async forgotPassword(email: string, recaptchaToken: string): Promise<void> {
    await this.verifyCaptcha(recaptchaToken);
    
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user || !user.isActive) {
      // Do not reveal if the user exists or not for security reasons
      return;
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Token expires in 1 hour
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = expires;
    await this.userRepository.save(user);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    await this.emailService.sendPasswordResetEmail(user.email, resetLink);
  }

  async resetPassword(token: string, newPassword: string, recaptchaToken: string): Promise<void> {
    await this.verifyCaptcha(recaptchaToken);

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.userRepository.findOne({
      where: {
        resetPasswordToken: hashedToken,
      },
      select: ['id', 'resetPasswordToken', 'resetPasswordExpires', 'isActive', 'passwordHash'], // Ensure passwordHash can be overwritten
    });

    if (!user || !user.isActive) {
      throw new BadRequestException('Token is invalid or has expired');
    }

    if (!user.resetPasswordExpires || new Date() > user.resetPasswordExpires) {
      throw new BadRequestException('Token is invalid or has expired');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = null as any;
    user.resetPasswordExpires = null as any;
    
    // Invalidate refresh tokens so other sessions are logged out
    user.refreshToken = null as any;

    await this.userRepository.save(user);
  }

  private async verifyCaptcha(token: string): Promise<void> {
    if (!token) {
      throw new BadRequestException('CAPTCHA verification failed. Token missing.');
    }

    const secret = this.configService.get<string>('RECAPTCHA_SECRET_KEY');
    if (!secret) {
      console.warn('RECAPTCHA_SECRET_KEY is not configured. Skipping verification.');
      return;
    }

    try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret,
          response: token,
        }).toString(),
      });

      const data = await response.json();
      if (!data.success) {
        throw new UnauthorizedException('CAPTCHA verification failed.');
      }
    } catch (err: any) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('CAPTCHA verification failed.');
    }
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashedToken = await bcrypt.hash(refreshToken, 12);
    await this.userRepository.update(userId, { refreshToken: hashedToken });
  }
}
