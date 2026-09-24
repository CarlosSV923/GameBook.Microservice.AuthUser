export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super('The email address is already registered.');
    this.name = 'EmailAlreadyRegisteredError';
  }
}
