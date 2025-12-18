import { ICompanyPartnershipRepository } from '../../../domain/company/repository/ICompanyPartnershipRepository';
import { ICompanyRepository } from '../../../domain/company/repository/ICompanyRepository';
import { CreatePartnershipInput } from '../dto/CreatePartnershipInput';
import { PartnershipOutput } from '../dto/PartnershipOutput';
import { v4 as uuidv4 } from 'uuid';

export class CreatePartnership {
  constructor(
    private partnershipRepository: ICompanyPartnershipRepository,
    private companyRepository: ICompanyRepository
  ) {}

  async execute(companyId: string, input: CreatePartnershipInput): Promise<PartnershipOutput> {
    // 自分自身との連携は不可
    if (companyId === input.partnerCompanyId) {
      throw new Error('自分自身を連携企業として追加することはできません');
    }

    // 既存の関係をチェック
    const exists = await this.partnershipRepository.exists(companyId, input.partnerCompanyId);
    if (exists) {
      throw new Error('既に連携企業として登録されています');
    }

    // パートナー会社の存在確認
    const partnerCompany = await this.companyRepository.findById(input.partnerCompanyId);
    if (!partnerCompany) {
      throw new Error('連携企業が見つかりません');
    }

    // 連携企業関係を作成
    const partnership = await this.partnershipRepository.create(companyId, input.partnerCompanyId);

    return new PartnershipOutput(
      partnership.id,
      partnerCompany.id,
      partnerCompany.name,
      partnership.createdAt
    );
  }
}

