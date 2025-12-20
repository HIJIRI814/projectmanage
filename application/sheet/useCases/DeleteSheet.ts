import { ISheetRepository } from '~domain/sheet/model/ISheetRepository';

export class DeleteSheet {
  constructor(private sheetRepository: ISheetRepository) {}

  async execute(sheetId: string): Promise<void> {
    const sheet = await this.sheetRepository.findById(sheetId);
    if (!sheet) {
      throw new Error('Sheet not found');
    }

    await this.sheetRepository.delete(sheetId);
  }
}

