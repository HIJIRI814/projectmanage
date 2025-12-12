import { describe, it, expect } from 'vitest';
import { Email } from './Email';

describe('Email', () => {
  describe('constructor', () => {
    it('should create an Email instance with a valid email address', () => {
      const email = new Email('test@example.com');
      expect(email).toBeInstanceOf(Email);
      expect(email.toString()).toBe('test@example.com');
    });

    it('should normalize email to lowercase', () => {
      const email = new Email('Test@Example.COM');
      expect(email.toString()).toBe('test@example.com');
    });

    it('should throw an error for invalid email format', () => {
      expect(() => new Email('invalid-email')).toThrow('Invalid email format');
      expect(() => new Email('invalid@')).toThrow('Invalid email format');
      expect(() => new Email('@example.com')).toThrow('Invalid email format');
      expect(() => new Email('invalid@example')).toThrow('Invalid email format');
      expect(() => new Email('')).toThrow('Invalid email format');
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user_name@example-domain.com',
      ];

      validEmails.forEach((emailStr) => {
        expect(() => new Email(emailStr)).not.toThrow();
      });
    });
  });

  describe('equals', () => {
    it('should return true for equal email addresses', () => {
      const email1 = new Email('test@example.com');
      const email2 = new Email('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return true for equal emails with different case', () => {
      const email1 = new Email('Test@Example.COM');
      const email2 = new Email('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different email addresses', () => {
      const email1 = new Email('test1@example.com');
      const email2 = new Email('test2@example.com');
      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the normalized email string', () => {
      const email = new Email('Test@Example.COM');
      expect(email.toString()).toBe('test@example.com');
    });
  });
});

