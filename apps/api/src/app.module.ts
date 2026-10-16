import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import * as Joi from 'joi';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ItemsModule } from './modules/items/items.module';
import { SearchModule } from './modules/search/search.module';
import { MatchingModule } from './modules/matching/matching.module';
import { ClaimsModule } from './modules/claims/claims.module';
import { ChatModule } from './modules/chat/chat.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { QrModule } from './modules/qr/qr.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ReputationModule } from './modules/reputation/reputation.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdminModule } from './modules/admin/admin.module';
import { VerificationModule } from './modules/verification/verification.module';
import { EmailModule } from './modules/email/email.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    // Configuration with full env validation
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3001),
        FRONTEND_URL: Joi.string().optional().default('http://localhost:3000'),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().default('15m'),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
        DATABASE_URL: Joi.string().optional().allow(''),
        DATABASE_HOST: Joi.string().optional().allow(''),
        DATABASE_PORT: Joi.number().optional(),
        DATABASE_NAME: Joi.string().optional().allow(''),
        DATABASE_USER: Joi.string().optional().allow(''),
        DATABASE_PASSWORD: Joi.string().optional().allow(''),
        RECAPTCHA_SECRET_KEY: Joi.string().optional().allow(''),
        // SMTP (optional – fallback to console log if not set)
        SMTP_HOST: Joi.string().optional().allow(''),
        SMTP_PORT: Joi.number().optional().default(587),
        SMTP_USER: Joi.string().optional().allow(''),
        SMTP_PASSWORD: Joi.string().optional().allow(''),
        SMTP_FROM_EMAIL: Joi.string().email().optional().allow(''),
      }),
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get('NODE_ENV') === 'production';
        const dbUrl = config.get<string>('DATABASE_URL');
        const dbHost = config.get<string>('DATABASE_HOST');
        const isPostgres = !!dbUrl || !!dbHost;

        if (!isPostgres && isProduction) {
          console.warn('[Database] WARNING: Neither DATABASE_URL nor DATABASE_HOST was provided in production. Defaulting to local sqlite fallback.');
        }

        return {
          type: isPostgres ? 'postgres' : 'sqlite',
          ...(isPostgres
            ? dbUrl
              ? {
                  url: dbUrl,
                  ssl: { rejectUnauthorized: false }, // Supabase needs this
                }
              : {
                  host: config.get<string>('DATABASE_HOST'),
                  port: config.get<number>('DATABASE_PORT'),
                  database: config.get<string>('DATABASE_NAME'),
                  username: config.get<string>('DATABASE_USER'),
                  password: config.get<string>('DATABASE_PASSWORD'),
                  ssl: { rejectUnauthorized: false }, // Required for Supabase / remote postgres
                }
            : {
                database: 'database.sqlite',
              }),
          entities: [
            __dirname + '/database/entities/**/*.entity{.ts,.js}',
            __dirname + '/database/entities/all-entities{.ts,.js}'
          ],
          synchronize: !isProduction,
          logging: !isProduction,
        } as any;
      },
    }),

    // Rate limiting — global (60 req/min) + auth-specific (10 req/min)
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 60,
      },
    ]),

    // Scheduled tasks
    ScheduleModule.forRoot(),

    // Feature modules
    AuthModule,
    UsersModule,
    ItemsModule,
    SearchModule,
    MatchingModule,
    ClaimsModule,
    ChatModule,
    NotificationsModule,
    UploadsModule,
    QrModule,
    OrganizationsModule,
    ReputationModule,
    AnalyticsModule,
    AdminModule,
    VerificationModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
