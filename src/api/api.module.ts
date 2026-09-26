import {
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ChangeMyPasswordController } from './users/change-my-password.controller.js';
import { GetCurrentSessionController } from './auth/get-current-session.controller.js';
import { LoginUserController } from './auth/login-user.controller.js';
import { RegisterUserController } from './auth/register-user.controller.js';
import { ApiExceptionFilter } from './http/api-exception.filter.js';
import { RequestIdMiddleware } from './http/request-id.js';
import { RequestLoggingMiddleware } from './http/request-logging.middleware.js';
import { createValidationPipe } from './http/validation-pipe.js';
import { ApplicationModule } from '../application/application.module.js';

@Module({
  imports: [ApplicationModule],
  controllers: [
    RegisterUserController,
    LoginUserController,
    GetCurrentSessionController,
    ChangeMyPasswordController,
  ],
  providers: [
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_PIPE, useFactory: createValidationPipe },
  ],
})
export class ApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestIdMiddleware, RequestLoggingMiddleware)
      .forRoutes('*');
  }
}
