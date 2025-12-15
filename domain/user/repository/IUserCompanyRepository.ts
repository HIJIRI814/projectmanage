import { UserCompany } from '../model/UserCompany';

export interface IUserCompanyRepository {
  findByUserId(userId: string): Promise<UserCompany[]>;
  findByCompanyId(companyId: string): Promise<UserCompany[]>;
  findByUserIdAndCompanyId(userId: string, companyId: string): Promise<UserCompany | null>;
  save(userCompany: UserCompany): Promise<UserCompany>;
  delete(id: string): Promise<void>;
}

