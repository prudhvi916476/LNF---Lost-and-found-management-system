import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    if (host) {
      const port = this.configService.get<number>('SMTP_PORT') ?? 587;
      const isSecure = port === 465; // 465 = implicit TLS; 587 = STARTTLS

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: isSecure,       // true for port 465, false for 587 (STARTTLS)
        requireTLS: !isSecure,  // enforce STARTTLS upgrade on port 587
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASSWORD'),
        },
        tls: {
          // Only disable strict cert checking in development to avoid self-signed issues
          rejectUnauthorized: this.configService.get<string>('NODE_ENV') === 'production',
        },
      });
    }
  }

  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`No SMTP config found. Simulated reset link for ${to}: ${resetLink}`);
      return;
    }

    const from = this.configService.get<string>('SMTP_FROM_EMAIL');
    const fromAddress = from || '"LNF Team" <noreply@lnf.app>';

    try {
      await this.transporter.sendMail({
        from: fromAddress,
        to,
        subject: 'Password Reset Request – LNF',
        text: `You requested a password reset.\n\nClick this link to reset your password:\n${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email and your password will remain unchanged.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
            <div style="background: linear-gradient(135deg, #6366f1, #4338ca); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">LNF – Lost & Found Network</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #1e293b; font-size: 20px;">Password Reset Request</h2>
              <p style="color: #475569;">You requested a password reset for your LNF account. Click the button below to set a new password.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background: linear-gradient(135deg, #6366f1, #4338ca); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">Reset My Password</a>
              </div>
              <p style="color: #64748b; font-size: 14px;">This link will expire in <strong>1 hour</strong>. If you did not request this, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
              <p style="color: #94a3b8; font-size: 12px; text-align: center;">LNF – Universal Lost &amp; Found Recovery Network</p>
            </div>
          </div>
        `,
      });
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}`, error);
      throw error;
    }
  }
}
