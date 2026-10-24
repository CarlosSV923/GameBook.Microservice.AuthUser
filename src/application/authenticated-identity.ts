export interface AuthenticatedIdentity {
  readonly userId: string;
  readonly sessionVersion: number;
}
