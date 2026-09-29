import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.ts';
import { configureHttpApplication } from './api/http/configure-http-application.ts';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureHttpApplication(app);
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
