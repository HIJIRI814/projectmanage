import { describe, it, expect } from 'vitest';
import { AuthDomainService } from './AuthDomainService';
import { User } from '../model/User';
import { Email } from '../model/Email';

describe('AuthDomainService', () => {
  const authDomainService = new AuthDomainService();
  const userId = 'test-user-id';
  const userEmail = 'test@example.com';
  const userName = 'Test User';
  const plainPassword = 'password123';

  describe('authenticateUser', () => {
    it('should return true for correct password', async () => {
      const email = new Email(userEmail);
      const user = await User.create(userId, email, plainPassword, userName);
      const isAuthenticated = await authDomainService.authenticateUser(
        user,
        plainPassword
      );
      expect(isAuthenticated).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const email = new Email(userEmail);
      const user = await User.create(userId, email, plainPassword, userName);
      const isAuthenticated = await authDomainService.authenticateUser(
        user,
        'wrongpassword'
      );
      expect(isAuthenticated).toBe(false);
    });

    it('should return false for empty password', async () => {
      const email = new Email(userEmail);
      const user = await User.create(userId, email, plainPassword, userName);
      const isAuthenticated = await authDomainService.authenticateUser(user, '');
      expect(isAuthenticated).toBe(false);
    });

    it('should work with different users', async () => {
      const email1 = new Email('user1@example.com');
      const email2 = new Email('user2@example.com');
      const user1 = await User.create('id1', email1, 'password1', 'User 1');
      const user2 = await User.create('id2', email2, 'password2', 'User 2');

      const auth1 = await authDomainService.authenticateUser(user1, 'password1');
      const auth2 = await authDomainService.authenticateUser(user2, 'password2');

      expect(auth1).toBe(true);
      expect(auth2).toBe(true);

      const wrongAuth1 = await authDomainService.authenticateUser(
        user1,
        'password2'
      );
      const wrongAuth2 = await authDomainService.authenticateUser(
        user2,
        'password1'
      );

      expect(wrongAuth1).toBe(false);
      expect(wrongAuth2).toBe(false);
    });
  });

  describe('isEmailValid', () => {
    it('should return true for valid email', () => {
      const email = new Email('test@example.com');
      const isValid = authDomainService.isEmailValid(email);
      expect(isValid).toBe(true);
    });

    it('should return true for email with length > 0', () => {
      const email = new Email('a@b.co');
      const isValid = authDomainService.isEmailValid(email);
      expect(isValid).toBe(true);
    });

    it('should return true for any valid Email instance', () => {
      const emails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
      ];

      emails.forEach((emailStr) => {
        const email = new Email(emailStr);
        const isValid = authDomainService.isEmailValid(email);
        expect(isValid).toBe(true);
      });
    });
  });
});

