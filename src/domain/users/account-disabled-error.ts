export class AccountDisabledError extends Error {
  constructor() {
    super('The account is disabled.');
    this.name = 'AccountDisabledError';
  }
}
