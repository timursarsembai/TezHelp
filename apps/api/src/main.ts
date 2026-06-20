import "reflect-metadata";

import { ValidationPipe, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { Express, Request, Response } from "express";

import { ApiRootModule } from "./root/api-root.module.js";
import { AppConfigService } from "./foundation/configuration/app-config.service.js";
import { GlobalErrorFilter } from "./foundation/http/global-error.filter.js";
import { CorrelationIdInterceptor } from "./foundation/http/correlation-id.interceptor.js";

async function bootstrap() {
  const app = await NestFactory.create(ApiRootModule, { bufferLogs: true });
  const config = app.get(AppConfigService);

  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new GlobalErrorFilter());
  app.useGlobalInterceptors(new CorrelationIdInterceptor());

  const openApiConfig = new DocumentBuilder()
    .setTitle("TezHelp API")
    .setDescription("Foundation API for TezHelp")
    .setVersion("0.0.0")
    .build();
  const document = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup("docs", app, document);
  const expressInstance = app.getHttpAdapter().getInstance() as Express;
  expressInstance.get("/openapi.json", (_request: Request, response: Response) => {
    response.json(document);
  });

  await app.listen(config.port);
}

void bootstrap();
