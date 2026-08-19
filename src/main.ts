import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '@/app.module';
import { EnvVar } from '@config/env-var';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');

  const corsOrigin = config.get<string>(EnvVar.CORS_ORIGIN) ?? '*';
  app.enableCors({
    origin: corsOrigin.includes(',')
      ? corsOrigin.split(',').map((origin) => origin.trim())
      : corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  if (config.get<boolean>(EnvVar.SHOW_SWAGGER)) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SprintBoard API')
      .setDescription('Mini-Jira backend: projects, sprints and tickets.')
      .setVersion('0.1')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Firebase ID token',
        },
        'JWT-auth',
      )
      .build();
    const factory = () => SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, factory, {
      customSiteTitle: 'SprintBoard API',
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = config.get<number>(EnvVar.PORT) ?? 4000;
  await app.listen(port);
  Logger.log(
    `SprintBoard API running on http://localhost:${port}/api (docs at /docs)`,
    'Bootstrap',
  );
}

void bootstrap();
