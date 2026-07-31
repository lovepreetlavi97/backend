import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { getEnvConfig } from './config/env.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = getEnvConfig();

  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.enableCors({ origin: '*', credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MYG (Guru Jewellers) Enterprise REST API')
    .setDescription('Enterprise NestJS API for E-Commerce, Gold Kitty Savings & Payment Processing')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(config.port);
  console.log(`🚀 NestJS Enterprise API Server running on http://localhost:${config.port}/api/v1`);
  console.log(`📚 Swagger API Docs available at http://localhost:${config.port}/api-docs`);
}

bootstrap();
