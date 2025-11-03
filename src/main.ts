import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Barang API')
    .setDescription('Users, Barang, Stock, Pricing with JWT + HMAC signature')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addApiKey({
      type: 'apiKey',
      name: 'x-api-key-id',
      in: 'header',
      description: 'Public key id',
    }, 'apiKeyId')
    .addApiKey({
      type: 'apiKey',
      name: 'x-api-ts',
      in: 'header',
      description: 'Unix timestamp (seconds)',
    }, 'apiTs')
    .addApiKey({
      type: 'apiKey',
      name: 'x-api-sig',
      in: 'header',
      description: 'HMAC signature (hex)',
    }, 'apiSig')
    .build();


  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);


  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
}
bootstrap();