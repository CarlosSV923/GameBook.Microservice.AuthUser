export interface JwtClaims {
  readonly sub: string;
  readonly ver: number;
  readonly iat: number;
  readonly exp: number;
  readonly iss: string;
  readonly aud: string;
}

export interface JwtSigner {
  sign(claims: JwtClaims): Promise<string>;
}

export interface JwtVerifier {
  verify(token: string): Promise<JwtClaims>;
}
