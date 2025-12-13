import { ISheetRepository } from '../../../domain/sheet/model/ISheetRepository';
import { SheetOutput } from '../dto/SheetOutput';

export class GetSheet {
  constructor(private sheetRepository: ISheetRepository) {}

  async execute(sheetId: string): Promise<SheetOutput> {
    const sheet = await this.sheetRepository.findById(sheetId);
    if (!sheet) {
      throw new Error('Sheet not found');
    }

    return new SheetOutput(
      sheet.id,
      sheet.projectId,
      sheet.name,
      sheet.description,
      sheet.content,
      sheet.createdAt,
      sheet.updatedAt
    );
  }
}

