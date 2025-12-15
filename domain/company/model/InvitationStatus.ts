export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export const InvitationStatusLabel: Record<InvitationStatus, string> = {
  [InvitationStatus.PENDING]: '保留中',
  [InvitationStatus.ACCEPTED]: '承認済み',
  [InvitationStatus.REJECTED]: '拒否済み',
  [InvitationStatus.EXPIRED]: '期限切れ',
};

