import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { PrismaClient } from './generated/client.js';
import { loadAuthRuntimeConfig } from '../../config/auth-runtime-config.js';
import { createPrismaClient } from './prisma-client.js';

@Injectable()
export class PrismaService implements OnApplicationShutdown {
  readonly client: PrismaClient;

  constructor() {
    const configuration = loadAuthRuntimeConfig();
    this.client = createPrismaClient(configuration.databaseUrl);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.$disconnect();
  }
}
