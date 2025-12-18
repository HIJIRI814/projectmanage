import { describe, it, expect } from 'vitest';
import { CompanyPartnership } from './CompanyPartnership';

describe('CompanyPartnership', () => {
  describe('create', () => {
    it('should create a partnership with sorted company IDs', () => {
      const id = 'partnership-1';
      const companyId1 = 'company-a';
      const companyId2 = 'company-b';

      const partnership = CompanyPartnership.create(id, companyId1, companyId2);

      expect(partnership.id).toBe(id);
      expect(partnership.companyId1).toBe(companyId1);
      expect(partnership.companyId2).toBe(companyId2);
      expect(partnership.createdAt).toBeInstanceOf(Date);
    });

    it('should sort company IDs when companyId1 > companyId2', () => {
      const id = 'partnership-1';
      const companyId1 = 'company-z';
      const companyId2 = 'company-a';

      const partnership = CompanyPartnership.create(id, companyId1, companyId2);

      expect(partnership.companyId1).toBe(companyId2);
      expect(partnership.companyId2).toBe(companyId1);
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct a partnership from existing data', () => {
      const id = 'partnership-1';
      const companyId1 = 'company-a';
      const companyId2 = 'company-b';
      const createdAt = new Date('2024-01-01');

      const partnership = CompanyPartnership.reconstruct(id, companyId1, companyId2, createdAt);

      expect(partnership.id).toBe(id);
      expect(partnership.companyId1).toBe(companyId1);
      expect(partnership.companyId2).toBe(companyId2);
      expect(partnership.createdAt).toBe(createdAt);
    });
  });

  describe('getPartnerCompanyId', () => {
    it('should return companyId2 when currentCompanyId is companyId1', () => {
      const partnership = CompanyPartnership.reconstruct(
        'partnership-1',
        'company-a',
        'company-b',
        new Date()
      );

      const partnerId = partnership.getPartnerCompanyId('company-a');

      expect(partnerId).toBe('company-b');
    });

    it('should return companyId1 when currentCompanyId is companyId2', () => {
      const partnership = CompanyPartnership.reconstruct(
        'partnership-1',
        'company-a',
        'company-b',
        new Date()
      );

      const partnerId = partnership.getPartnerCompanyId('company-b');

      expect(partnerId).toBe('company-a');
    });
  });
});

