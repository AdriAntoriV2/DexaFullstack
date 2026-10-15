
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('WFH Attendance API')
    .setDescription(
      'Authentication, employee profile management, and HR administration.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const corsHr = process.env.CORS_HR?.trim();
  const corsEmployees = process.env.CORS_EMPLOYEES?.trim();

  if (!corsHr || !corsEmployees) {
    throw new Error(
      'Missing required environment variables: CORS_HR and CORS_EMPLOYEES must both be configured.',
    );
  }

  app.enableCors({
    origin: [corsHr, corsEmployees],
  });

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
