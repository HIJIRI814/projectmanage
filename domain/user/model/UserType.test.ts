import { describe, it, expect } from 'vitest';
import { UserType, UserTypeValue, UserTypeLabel } from './UserType';

describe('UserType', () => {
  describe('enum', () => {
    it('should have correct values', () => {
      expect(UserType.ADMINISTRATOR).toBe(1);
      expect(UserType.MEMBER).toBe(2);
      expect(UserType.PARTNER).toBe(3);
      expect(UserType.CUSTOMER).toBe(4);
    });
  });

  describe('UserTypeLabel', () => {
    it('should have correct labels', () => {
      expect(UserTypeLabel[UserType.ADMINISTRATOR]).toBe('管理者');
      expect(UserTypeLabel[UserType.MEMBER]).toBe('メンバー');
      expect(UserTypeLabel[UserType.PARTNER]).toBe('パートナー');
      expect(UserTypeLabel[UserType.CUSTOMER]).toBe('顧客');
    });
  });

  describe('UserTypeValue', () => {
    it('should create from valid UserType', () => {
      const userType = new UserTypeValue(UserType.ADMINISTRATOR);
      expect(userType.toNumber()).toBe(UserType.ADMINISTRATOR);
      expect(userType.getLabel()).toBe('管理者');
    });

    it('should create from number', () => {
      const userType = UserTypeValue.fromNumber(UserType.MEMBER);
      expect(userType.toNumber()).toBe(UserType.MEMBER);
      expect(userType.getLabel()).toBe('メンバー');
    });

    it('should throw error for invalid number', () => {
      expect(() => UserTypeValue.fromNumber(999)).toThrow('Invalid user type');
    });

    it('should throw error for invalid UserType in constructor', () => {
      expect(() => new UserTypeValue(999 as UserType)).toThrow('Invalid user type');
    });

    it('should check equality', () => {
      const type1 = new UserTypeValue(UserType.ADMINISTRATOR);
      const type2 = new UserTypeValue(UserType.ADMINISTRATOR);
      const type3 = new UserTypeValue(UserType.MEMBER);

      expect(type1.equals(type2)).toBe(true);
      expect(type1.equals(type3)).toBe(false);
    });

    it('should check if administrator', () => {
      const adminType = new UserTypeValue(UserType.ADMINISTRATOR);
      const memberType = new UserTypeValue(UserType.MEMBER);

      expect(adminType.isAdministrator()).toBe(true);
      expect(memberType.isAdministrator()).toBe(false);
    });
  });
});



