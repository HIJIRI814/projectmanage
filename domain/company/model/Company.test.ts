import { describe, it, expect } from 'vitest';
import { Company } from './Company';

describe('Company', () => {
  const companyId = 'test-company-id';
  const companyName = 'Test Company';

  describe('create', () => {
    it('should create a new Company', () => {
      const company = Company.create(companyId, companyName);

      expect(company).toBeInstanceOf(Company);
      expect(company.id).toBe(companyId);
      expect(company.name).toBe(companyName);
      expect(company.createdAt).toBeInstanceOf(Date);
      expect(company.updatedAt).toBeInstanceOf(Date);
    });

    it('should set createdAt and updatedAt to the same time on creation', () => {
      const company = Company.create(companyId, companyName);

      expect(company.createdAt.getTime()).toBe(company.updatedAt.getTime());
    });

    it('should create companies with different IDs', () => {
      const company1 = Company.create('id1', 'Company 1');
      const company2 = Company.create('id2', 'Company 2');

      expect(company1.id).toBe('id1');
      expect(company2.id).toBe('id2');
      expect(company1.id).not.toBe(company2.id);
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct a Company from existing data', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const company = Company.reconstruct(companyId, companyName, createdAt, updatedAt);

      expect(company).toBeInstanceOf(Company);
      expect(company.id).toBe(companyId);
      expect(company.name).toBe(companyName);
      expect(company.createdAt).toEqual(createdAt);
      expect(company.updatedAt).toEqual(updatedAt);
    });

    it('should preserve different createdAt and updatedAt dates', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-15');

      const company = Company.reconstruct(companyId, companyName, createdAt, updatedAt);

      expect(company.createdAt.getTime()).not.toBe(company.updatedAt.getTime());
      expect(company.createdAt).toEqual(createdAt);
      expect(company.updatedAt).toEqual(updatedAt);
    });
  });
});

