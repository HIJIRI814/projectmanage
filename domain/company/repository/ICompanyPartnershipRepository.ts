import { CompanyPartnership } from '../model/CompanyPartnership';

export interface ICompanyPartnershipRepository {
  findByCompanyId(companyId: string): Promise<CompanyPartnership[]>;
  create(companyId1: string, companyId2: string): Promise<CompanyPartnership>;
  exists(companyId1: string, companyId2: string): Promise<boolean>;
}





