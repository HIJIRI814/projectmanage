import { Company } from '../model/Company';

export interface ICompanyRepository {
  findAll(): Promise<Company[]>;
  findById(id: string): Promise<Company | null>;
  save(company: Company): Promise<Company>;
  delete(id: string): Promise<void>;
}

