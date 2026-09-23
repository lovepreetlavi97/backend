"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.env.UV_THREADPOOL_SIZE = '64';
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = require("helmet");
const cookieParser = require("cookie-parser");
const express = require("express");
const path = require("path");
const env_config_1 = require("./config/env.config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const config = (0, env_config_1.getEnvConfig)();
    app.setGlobalPrefix('api/v1');
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: false,
    }));
    app.use(cookieParser());
    app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || config.allowedOrigins.includes(origin) || config.nodeEnv === 'development') {
                callback(null, true);
            }
            else {
                callback(new Error(`CORS blocked for origin: ${origin}`));
            }
        },
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
    }));
    app.useGlobalFilters(new http_exception_filter_1.GlobalHttpExceptionFilter());
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('MYG (Guru Jewellers) Enterprise REST API')
        .setDescription('Enterprise NestJS API for E-Commerce, Gold Kitty Savings & Payment Processing')
        .setVersion('2.0.0')
        .addBearerAuth()
        .addCookieAuth('accessToken')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api-docs', app, document);
    await app.listen(config.port, '0.0.0.0');
    console.log(`🚀 NestJS Enterprise API Server running on http://localhost:${config.port}/api/v1`);
    console.log(`📚 Swagger API Docs available at http://localhost:${config.port}/api-docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map