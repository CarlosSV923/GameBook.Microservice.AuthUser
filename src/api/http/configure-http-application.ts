import type { INestApplication } from '@nestjs/common';
import { createCorsOptions } from './cors-options.ts';
import { configureSwagger } from '../openapi/configure-swagger.ts';

export function configureHttpApplication(
  application: INestApplication,
  environment: NodeJS.ProcessEnv = process.env,
): void {
  application.enableCors(createCorsOptions(environment));
  configureSwagger(application);
}
