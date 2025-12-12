import bcrypt from 'bcrypt';

export class PasswordHash {
  private readonly value: string;

  private constructor(hashedPassword: string) {
    this.value = hashedPassword;
  }

  static async create(plainPassword: string): Promise<PasswordHash> {
    if (plainPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    const hashed = await bcrypt.hash(plainPassword, 10);
    return new PasswordHash(hashed);
  }

  static fromHash(hashedPassword: string): PasswordHash {
    return new PasswordHash(hashedPassword);
  }

  async verify(plainPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, this.value);
  }

  toString(): string {
    return this.value;
  }
}

