import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app/app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable CORS for dashboard
  app.enableCors();

  const port = process.env["PORT"] || 3000;
  await app.listen(port);

  Logger.log(`🚀 OpenSpawn API running on http://localhost:${port}`);
}

bootstrap();
