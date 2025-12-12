export class AuthResult {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string,
    public readonly user: {
      id: string;
      email: string;
      name: string;
    }
  ) {}
}

