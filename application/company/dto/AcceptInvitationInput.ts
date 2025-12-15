export class AcceptInvitationInput {
  constructor(
    public readonly token: string,
    public readonly userId: string
  ) {}
}

