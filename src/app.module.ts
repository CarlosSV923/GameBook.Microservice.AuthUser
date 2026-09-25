import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiModule } from './api/api.module.js';
import {
  validateAuthConfiguration,
} from './infrastructure/config/auth-runtime-config.js';

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
