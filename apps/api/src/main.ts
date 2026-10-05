import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import * as hpp from 'hpp';
import { AppModule } from './app.module';
import { v4 as uuidv4 } from 'uuid';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  const isProduction = process.env.NODE_ENV === 'production';

  // ─── Security Headers (Helmet) ───────────────────────────
  app.use(helmet({
    crossOriginResourcePolicy: { policy: isProduction ? 'same-site' : 'cross-origin' },
    contentSecurityPolicy: isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'https://www.google.com', 'https://www.gstatic.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", process.env.FRONTEND_URL || ''],
            frameSrc: ["'self'", 'https://www.google.com'],  // reCAPTCHA iframes
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [] as string[],
          },
        }
      : false,
    hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));

  // ─── Request ID Middleware ───────────────────────────────
  app.use((req: any, res: any, next: () => void) => {
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
  });

  // ─── Payload & URL Protections ──────────────────────────
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(hpp());  // Prevent HTTP Parameter Pollution

  // ─── CORS ───────────────────────────────────────────────
  const allowedOrigin = isProduction
    ? process.env.FRONTEND_URL
    : (process.env.FRONTEND_URL || 'http://localhost:3000');

  app.enableCors({
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
  });

  // ─── Global Prefix ──────────────────────────────────────
  app.setGlobalPrefix('api');

  // ─── Validation ─────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── Swagger API Docs (dev only) ────────────────────────
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('LNF API')
      .setDescription('Universal Lost & Found Recovery Network API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('lost-items', 'Lost item reporting & management')
      .addTag('found-items', 'Found item reporting & management')
      .addTag('search', 'Advanced search engine')
      .addTag('matches', 'AI-powered item matching')
      .addTag('claims', 'Claim management & verification')
      .addTag('chat', 'Secure messaging')
      .addTag('notifications', 'Notification management')
      .addTag('qr', 'QR code smart tagging')
      .addTag('organizations', 'Organization management')
      .addTag('analytics', 'Analytics & reporting')
      .addTag('admin', 'Admin operations')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('📚 API Docs available at /api/docs (development only)');
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`🚀 LNF API running on http://localhost:${port} [${process.env.NODE_ENV || 'development'}]`);
}

bootstrap();
