import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";

import { RequestLoggerMiddleware } from "./request-logger.middleware.js";

@Module({})
export class HttpFoundationModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes("*");
  }
}
