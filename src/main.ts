import 'dotenv/config';
process.env.UV_THREADPOOL_SIZE = '64';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import * as path from 'path';
import { getEnvConfig } from './config/env.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = getEnvConfig();

  app.setGlobalPrefix('api/v1');
  app.use(helmet({
    crossOriginResourcePolicy: false, // Ensure local assets can be loaded across domains
  }));
  app.use(cookieParser());
  app.use((req: any, res: any, next: any) => {
    console.log('[INCOMING REQ]', req.method, req.originalUrl || req.url);
    next();
  });
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/', (req: any, res: any) => {
    res.json({
      status: 'online',
      message: 'MYG Backend API Server is Running',
      docs: '/api-docs',
      health: '/api/v1/health',
      api_base: '/api/v1',
      version: '2.0.0'
    });
  });
  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        config.nodeEnv === 'development' ||
        config.allowedOrigins.includes(origin) ||
        origin.endsWith('.gurujewellers.in') ||
        origin.endsWith('.vercel.app') ||
        origin === 'https://gurujewellers.in'
      ) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  );

  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MYG (Guru Jewellers) Enterprise REST API')
    .setDescription('Enterprise NestJS API for E-Commerce, Gold Kitty Savings & Payment Processing')
    .setVersion('2.0.0')
    .addBearerAuth()
    .addCookieAuth('accessToken')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(config.port, '0.0.0.0');
  console.log(`🚀 NestJS Enterprise API Server running on http://localhost:${config.port}/api/v1`);
  console.log(`📚 Swagger API Docs available at http://localhost:${config.port}/api-docs`);
}

bootstrap();
