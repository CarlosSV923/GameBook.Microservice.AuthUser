import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from './generated/client.js';
import type { AuthEnvironment } from '../../config/auth-runtime-config.js';
import { createPrismaClient } from './prisma-client.js';

@Injectable()
export class PrismaService implements OnApplicationShutdown {
  readonly client: PrismaClient;

  constructor(config: ConfigService<AuthEnvironment, true>) {
    this.client = createPrismaClient(
      config.getOrThrow<string>('AUTH_DATABASE_URL'),
    );
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.$disconnect();
  }
}
