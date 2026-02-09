import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app/app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global API version prefix
  app.setGlobalPrefix('api/v1', {
    exclude: ['/health', '/ready', '/metrics'],
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable CORS for dashboard with restricted origins
  app.enableCors({
    origin: process.env['ALLOWED_ORIGINS']?.split(',') || ['http://localhost:4200', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  const port = process.env["PORT"] || 3000;
  const host = process.env["HOST"] || "0.0.0.0";
  await app.listen(port, host);

  Logger.log(`🚀 OpenSpawn API running on http://${host}:${port}`);
}

bootstrap();
