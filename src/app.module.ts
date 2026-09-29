import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiModule } from './api/api.module.ts';
import {
  validateAuthConfiguration,
} from './infrastructure/config/auth-runtime-config.ts';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateAuthConfiguration,
    }),
    ApiModule,
  ],
})
export class AppModule {}
