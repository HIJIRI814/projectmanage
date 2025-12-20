import { ISheetRepository } from '~domain/sheet/model/ISheetRepository';
import { Sheet } from '~domain/sheet/model/Sheet';
import { UpdateSheetInput } from '../dto/UpdateSheetInput';
import { SheetOutput } from '../dto/SheetOutput';

export class UpdateSheet {
  constructor(private sheetRepository: ISheetRepository) {}

  async execute(sheetId: string, input: UpdateSheetInput): Promise<SheetOutput> {
    const sheet = await this.sheetRepository.findById(sheetId);
    if (!sheet) {
      throw new Error('Sheet not found');
    }

    const updatedSheet = Sheet.reconstruct(
      sheet.id,
      sheet.projectId,
      input.name || sheet.name,
      input.description !== undefined ? input.description : sheet.description,
      input.content !== undefined ? input.content : sheet.content,
      input.imageUrl !== undefined ? input.imageUrl : sheet.imageUrl,
      sheet.createdAt,
      new Date()
    );

    const savedSheet = await this.sheetRepository.save(updatedSheet);

    return new SheetOutput(
      savedSheet.id,
      savedSheet.projectId,
      savedSheet.name,
      savedSheet.description,
      savedSheet.content,
      savedSheet.imageUrl,
      savedSheet.createdAt,
      savedSheet.updatedAt
    );
  }
}

