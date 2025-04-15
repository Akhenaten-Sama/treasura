import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Treasura API')
    .setDescription('The Treasura API documentation')
    .setVersion('1.0')
    .addTag('treasura')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // URL: /api/docs

  app.useGlobalPipes(new ValidationPipe());

  // Serve the exports directory as static files
  app.use('/exports', express.static(path.join(__dirname, '../exports')));

  await app.listen( 3000);
}
bootstrap();
