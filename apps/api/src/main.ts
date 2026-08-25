import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

// Fix BigInt JSON serialization — Prisma returns BigInt for BIGINT columns
(BigInt.prototype as any).toJSON = function () { return Number(this); };

async function bootstrap() {
  // Disable body parser globally — we apply it selectively below
  // (demo-upload needs raw body; other routes need JSON parsing)
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());

  // Apply JSON + urlencoded body parsing to all routes EXCEPT demo-upload
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const express = require('express');
  app.use((req: any, res: any, next: any) => {
    if (req.path && req.path.includes('/files/demo-upload')) {
      // Skip body parsing — the controller reads the raw stream directly
      return next();
    }
    express.json({ limit: '10mb' })(req, res, (err: any) => {
      if (err) return next(err);
      express.urlencoded({ extended: true })(req, res, next);
    });
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.APP_BASE_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.setGlobalPrefix('api');

  await app.listen(4000);
  console.log('API running on http://localhost:4000');
}
bootstrap();
