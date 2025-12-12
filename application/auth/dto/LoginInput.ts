export class LoginInput {
  constructor(
    public readonly email: string,
    public readonly password: string
  ) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
  }
}

