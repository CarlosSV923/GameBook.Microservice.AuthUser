import { EmailAddress } from '../../domain/users/email-address.js';
import type { JwtSigner } from '../ports/jwt-ports.js';
import type { PasswordHasher } from '../ports/password-hasher.js';
import type { UserRepository } from '../../domain/users/user-repository.js';

export const JWT_EXPIRES_IN_SECONDS = 3600;

export interface LoginUserInput {
  readonly email: string;
  readonly password: string;
}

export interface LoginUserOutput {
  readonly accessToken: string;
  readonly tokenType: 'Bearer';
  readonly expiresIn: typeof JWT_EXPIRES_IN_SECONDS;
  readonly user: {
    readonly id: string;
    readonly fullName: string;
    readonly email: string;
  };
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials.');
    this.name = 'InvalidCredentialsError';
  }
}

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtSigner: JwtSigner,
    private readonly jwtIssuer: string,
    private readonly jwtAudience: string,
    private readonly now: () => number = () => Math.floor(Date.now() / 1000),
  ) {}

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    let email: EmailAddress;
    try {
      email = EmailAddress.create(input.email);
    } catch {
      throw new InvalidCredentialsError();
    }

    const user = await this.userRepository.findByEmail(email);
    const passwordMatches = await this.passwordHasher.verify(
      input.password,
      user?.passwordHash ?? '',
    );

    if (!user || !passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const issuedAt = this.now();
    const accessToken = await this.jwtSigner.sign({
      sub: user.id,
      ver: user.sessionVersion,
      iat: issuedAt,
      exp: issuedAt + JWT_EXPIRES_IN_SECONDS,
      iss: this.jwtIssuer,
      aud: this.jwtAudience,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: JWT_EXPIRES_IN_SECONDS,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
    };
  }
}
