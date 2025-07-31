import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { corsConfiguration } from './config/cors-configuration';
import express from 'express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './lib/http-exception.filter';
import { ResponseFormatInterceptor } from './lib/response-format.interceptor';
import qs from 'qs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BasePaginatedResponseDto } from './base/dto';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: corsConfiguration,
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseFormatInterceptor());

  app.enableShutdownHooks();

  app
    .getHttpAdapter()
    .getInstance()
    .set('query parser', (str: string) => qs.parse(str));

  const options = new DocumentBuilder()
    .setTitle('Esusu')
    .setDescription('API documentation for Esusu')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http' })
    .build();

  const document = SwaggerModule.createDocument(app, options, {
    extraModels: [BasePaginatedResponseDto],
  });
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT || 8080, () => {
    new Logger().log(`API is started on PORT ${process.env.PORT || 8080}...`);
  });
}
bootstrap();
