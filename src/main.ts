import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { cert } from 'firebase-admin/app';
import { initializeApp } from 'firebase-admin/app';
import { AppModule } from './app.module';

initializeApp({
  credential: cert(JSON.parse(process.env.FIREBASE)),
  storageBucket: 'snapsnacks-f4123.appspot.com',
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  await app.listen(process.env.PORT || 4000);
}
bootstrap();
