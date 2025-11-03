import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';
import type { Request, Response } from 'express';


const rawBodySaver = (req: any, _res: any, buf: Buffer) => {
  if (buf?.length) {
    req.rawBody = buf;
  }
};


let cachedServer: any;


export async function bootstrap(isServerless = false) {
  const app = await NestFactory.create(AppModule);
  app.use(json({ verify: rawBodySaver }));
  app.use(urlencoded({ verify: rawBodySaver, extended: true }));
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


  if (isServerless) {
    await app.init();
    console.log('Running in SERVERLESS mode');
    return app;
  }


  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`Running in NORMAL server mode on http://localhost:${port}`);
  return app;
}


if (!process.env.SERVERLESS) {
  bootstrap(false).catch((err) => {
    console.error('Failed to bootstrap Nest application', err);
    process.exit(1);
  });
}


export default async function handler(req: Request, res: Response) {
  if (!cachedServer) {
    const app = await bootstrap(true);
    cachedServer = app.getHttpAdapter().getInstance();
  }
  return cachedServer(req, res);
}
