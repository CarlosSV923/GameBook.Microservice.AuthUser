import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureHttpApplication } from './api/http/configure-http-application.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureHttpApplication(app);
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
