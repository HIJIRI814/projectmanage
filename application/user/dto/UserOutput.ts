export class UserOutput {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly userType: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}



