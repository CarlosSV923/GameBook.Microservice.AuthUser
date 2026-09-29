import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ChangeMyPasswordController } from './users/change-my-password.controller.ts';
import { DisableMyAccountController } from './users/disable-my-account.controller.ts';
import { GetCurrentSessionController } from './auth/get-current-session.controller.ts';
import { LoginUserController } from './auth/login-user.controller.ts';
import { RegisterUserController } from './auth/register-user.controller.ts';
import { HealthController } from './health/health.controller.ts';
import { ApiExceptionFilter } from './http/api-exception.filter.ts';
import { RequestIdMiddleware } from './http/request-id.ts';
import { RequestLoggingMiddleware } from './http/request-logging.middleware.ts';
import { createValidationPipe } from './http/validation-pipe.ts';
import { ApplicationModule } from '../application/application.module.ts';

@Module({
  imports: [ApplicationModule],
  controllers: [
    RegisterUserController,
    LoginUserController,
    GetCurrentSessionController,
    ChangeMyPasswordController,
    DisableMyAccountController,
    HealthController,
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
