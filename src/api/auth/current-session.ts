import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export interface CurrentSessionIdentity {
  readonly userId: string;
  readonly sessionVersion: number;
  readonly fullName: string;
  readonly email: string;
}

export const CurrentSession = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentSessionIdentity =>
    context
      .switchToHttp()
      .getRequest<{ currentSession: CurrentSessionIdentity }>().currentSession,
);
