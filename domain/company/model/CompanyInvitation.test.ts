import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CompanyInvitation } from './CompanyInvitation';
import { InvitationStatus } from './InvitationStatus';
import { UserType } from '../../user/model/UserType';

describe('CompanyInvitation', () => {
  const companyId = 'test-company-id';
  const email = 'test@example.com';
  const userType = UserType.MEMBER;
  const invitedBy = 'inviter-user-id';

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('create', () => {
    it('should create a new CompanyInvitation', () => {
      const invitation = CompanyInvitation.create(companyId, email, userType, invitedBy);

      expect(invitation).toBeInstanceOf(CompanyInvitation);
      expect(invitation.companyId).toBe(companyId);
      expect(invitation.email).toBe(email);
      expect(invitation.userType).toBe(userType);
      expect(invitation.invitedBy).toBe(invitedBy);
      expect(invitation.status).toBe(InvitationStatus.PENDING);
      expect(invitation.token).toBeTruthy();
      expect(invitation.expiresAt).toBeInstanceOf(Date);
      expect(invitation.createdAt).toBeInstanceOf(Date);
      expect(invitation.updatedAt).toBeInstanceOf(Date);
    });

    it('should set expiresAt to 7 days from now by default', () => {
      const now = new Date('2024-01-01');
      vi.setSystemTime(now);

      const invitation = CompanyInvitation.create(companyId, email, userType, invitedBy);

      const expectedExpiresAt = new Date('2024-01-08');
      expect(invitation.expiresAt.getTime()).toBe(expectedExpiresAt.getTime());
    });

    it('should set expiresAt to custom days when provided', () => {
      const now = new Date('2024-01-01');
      vi.setSystemTime(now);

      const invitation = CompanyInvitation.create(companyId, email, userType, invitedBy, 14);

      const expectedExpiresAt = new Date('2024-01-15');
      expect(invitation.expiresAt.getTime()).toBe(expectedExpiresAt.getTime());
    });

    it('should generate unique tokens for each invitation', () => {
      const invitation1 = CompanyInvitation.create(companyId, email, userType, invitedBy);
      const invitation2 = CompanyInvitation.create(companyId, email, userType, invitedBy);

      expect(invitation1.token).not.toBe(invitation2.token);
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct a CompanyInvitation from existing data', () => {
      const id = 'invitation-id';
      const token = 'invitation-token';
      const status = InvitationStatus.PENDING;
      const expiresAt = new Date('2024-01-08');
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-01');

      const invitation = CompanyInvitation.reconstruct(
        id,
        companyId,
        email,
        token,
        userType,
        status,
        invitedBy,
        expiresAt,
        createdAt,
        updatedAt
      );

      expect(invitation).toBeInstanceOf(CompanyInvitation);
      expect(invitation.id).toBe(id);
      expect(invitation.companyId).toBe(companyId);
      expect(invitation.email).toBe(email);
      expect(invitation.token).toBe(token);
      expect(invitation.userType).toBe(userType);
      expect(invitation.status).toBe(status);
      expect(invitation.invitedBy).toBe(invitedBy);
      expect(invitation.expiresAt).toEqual(expiresAt);
      expect(invitation.createdAt).toEqual(createdAt);
      expect(invitation.updatedAt).toEqual(updatedAt);
    });
  });

  describe('isExpired', () => {
    it('should return true if expiresAt is in the past', () => {
      const now = new Date('2024-01-10');
      vi.setSystemTime(now);

      const expiresAt = new Date('2024-01-08');
      const invitation = CompanyInvitation.reconstruct(
        'id',
        companyId,
        email,
        'token',
        userType,
        InvitationStatus.PENDING,
        invitedBy,
        expiresAt,
        new Date('2024-01-01'),
        new Date('2024-01-01')
      );

      expect(invitation.isExpired()).toBe(true);
    });

    it('should return false if expiresAt is in the future', () => {
      const now = new Date('2024-01-01');
      vi.setSystemTime(now);

      const expiresAt = new Date('2024-01-08');
      const invitation = CompanyInvitation.reconstruct(
        'id',
        companyId,
        email,
        'token',
        userType,
        InvitationStatus.PENDING,
        invitedBy,
        expiresAt,
        new Date('2024-01-01'),
        new Date('2024-01-01')
      );

      expect(invitation.isExpired()).toBe(false);
    });
  });

  describe('isPending', () => {
    it('should return true if status is PENDING', () => {
      const invitation = CompanyInvitation.reconstruct(
        'id',
        companyId,
        email,
        'token',
        userType,
        InvitationStatus.PENDING,
        invitedBy,
        new Date('2024-01-08'),
        new Date('2024-01-01'),
        new Date('2024-01-01')
      );

      expect(invitation.isPending()).toBe(true);
    });

    it('should return false if status is not PENDING', () => {
      const invitation = CompanyInvitation.reconstruct(
        'id',
        companyId,
        email,
        'token',
        userType,
        InvitationStatus.ACCEPTED,
        invitedBy,
        new Date('2024-01-08'),
        new Date('2024-01-01'),
        new Date('2024-01-01')
      );

      expect(invitation.isPending()).toBe(false);
    });
  });

  describe('canBeAccepted', () => {
    it('should return true if status is PENDING and not expired', () => {
      const now = new Date('2024-01-01');
      vi.setSystemTime(now);

      const expiresAt = new Date('2024-01-08');
      const invitation = CompanyInvitation.reconstruct(
        'id',
        companyId,
        email,
        'token',
        userType,
        InvitationStatus.PENDING,
        invitedBy,
        expiresAt,
        new Date('2024-01-01'),
        new Date('2024-01-01')
      );

      expect(invitation.canBeAccepted()).toBe(true);
    });

    it('should return false if status is not PENDING', () => {
      const invitation = CompanyInvitation.reconstruct(
        'id',
        companyId,
        email,
        'token',
        userType,
        InvitationStatus.ACCEPTED,
        invitedBy,
        new Date('2024-01-08'),
        new Date('2024-01-01'),
        new Date('2024-01-01')
      );

      expect(invitation.canBeAccepted()).toBe(false);
    });

    it('should return false if expired', () => {
      const now = new Date('2024-01-10');
      vi.setSystemTime(now);

      const expiresAt = new Date('2024-01-08');
      const invitation = CompanyInvitation.reconstruct(
        'id',
        companyId,
        email,
        'token',
        userType,
        InvitationStatus.PENDING,
        invitedBy,
        expiresAt,
        new Date('2024-01-01'),
        new Date('2024-01-01')
      );

      expect(invitation.canBeAccepted()).toBe(false);
    });
  });

  describe('accept', () => {
    it('should return a new invitation with ACCEPTED status', () => {
      const now = new Date('2024-01-01');
      vi.setSystemTime(now);

      const expiresAt = new Date('2024-01-08');
      const invitation = CompanyInvitation.reconstruct(
        'id',
        companyId,
        email,
        'token',
        userType,
        InvitationStatus.PENDING,
        invitedBy,
        expiresAt,
        new Date('2024-01-01'),
        new Date('2024-01-01')
      );

      // 時間を進めてからacceptを呼び出す
      vi.advanceTimersByTime(1000);
      const accepted = invitation.accept();

      expect(accepted.status).toBe(InvitationStatus.ACCEPTED);
      expect(accepted.id).toBe(invitation.id);
      expect(accepted.updatedAt.getTime()).toBeGreaterThanOrEqual(invitation.updatedAt.getTime());
    });

    it('should throw error if invitation cannot be accepted', () => {
      const invitation = CompanyInvitation.reconstruct(
        'id',
        companyId,
        email,
        'token',
        userType,
        InvitationStatus.ACCEPTED,
        invitedBy,
        new Date('2024-01-08'),
        new Date('2024-01-01'),
        new Date('2024-01-01')
      );

      expect(() => invitation.accept()).toThrow('Invitation cannot be accepted');
    });
  });

  describe('reject', () => {
    it('should return a new invitation with REJECTED status', () => {
      const invitation = CompanyInvitation.reconstruct(
        'id',
        companyId,
        email,
        'token',
        userType,
        InvitationStatus.PENDING,
        invitedBy,
        new Date('2024-01-08'),
        new Date('2024-01-01'),
        new Date('2024-01-01')
      );

      const rejected = invitation.reject();

      expect(rejected.status).toBe(InvitationStatus.REJECTED);
      expect(rejected.id).toBe(invitation.id);
      expect(rejected.updatedAt.getTime()).toBeGreaterThan(invitation.updatedAt.getTime());
    });

    it('should throw error if invitation is not PENDING', () => {
      const invitation = CompanyInvitation.reconstruct(
        'id',
        companyId,
        email,
        'token',
        userType,
        InvitationStatus.ACCEPTED,
        invitedBy,
        new Date('2024-01-08'),
        new Date('2024-01-01'),
        new Date('2024-01-01')
      );

      expect(() => invitation.reject()).toThrow('Only pending invitations can be rejected');
    });
  });

  describe('expire', () => {
    it('should return a new invitation with EXPIRED status', () => {
      const invitation = CompanyInvitation.reconstruct(
        'id',
        companyId,
        email,
        'token',
        userType,
        InvitationStatus.PENDING,
        invitedBy,
        new Date('2024-01-08'),
        new Date('2024-01-01'),
        new Date('2024-01-01')
      );

      const expired = invitation.expire();

      expect(expired.status).toBe(InvitationStatus.EXPIRED);
      expect(expired.id).toBe(invitation.id);
      expect(expired.updatedAt.getTime()).toBeGreaterThan(invitation.updatedAt.getTime());
    });

    it('should throw error if invitation is not PENDING', () => {
      const invitation = CompanyInvitation.reconstruct(
        'id',
        companyId,
        email,
        'token',
        userType,
        InvitationStatus.ACCEPTED,
        invitedBy,
        new Date('2024-01-08'),
        new Date('2024-01-01'),
        new Date('2024-01-01')
      );

      expect(() => invitation.expire()).toThrow('Only pending invitations can be expired');
    });
  });
});

