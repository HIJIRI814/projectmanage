import { ICompanyPartnershipRepository } from '~domain/company/repository/ICompanyPartnershipRepository';
import { ICompanyRepository } from '~domain/company/repository/ICompanyRepository';
import { PartnershipOutput } from '../dto/PartnershipOutput';

export class ListPartnerships {
  constructor(
    private partnershipRepository: ICompanyPartnershipRepository,
    private companyRepository: ICompanyRepository
  ) {}

  async execute(companyId: string): Promise<PartnershipOutput[]> {
    const partnerships = await this.partnershipRepository.findByCompanyId(companyId);

    const outputs = await Promise.all(
      partnerships.map(async (partnership) => {
        const partnerCompanyId = partnership.getPartnerCompanyId(companyId);
        const partnerCompany = await this.companyRepository.findById(partnerCompanyId);
        
        if (!partnerCompany) {
          return null;
        }

        return new PartnershipOutput(
          partnership.id,
          partnerCompany.id,
          partnerCompany.name,
          partnership.createdAt
        );
      })
    );

    return outputs.filter((output): output is PartnershipOutput => output !== null);
  }
}






