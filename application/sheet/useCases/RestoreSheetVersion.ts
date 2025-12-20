import { ISheetRepository } from '~domain/sheet/model/ISheetRepository';
import { ISheetVersionRepository } from '~domain/sheet/model/ISheetVersionRepository';
import { Sheet } from '~domain/sheet/model/Sheet';
import { RestoreSheetVersionInput } from '../dto/RestoreSheetVersionInput';
import { SheetOutput } from '../dto/SheetOutput';

export class RestoreSheetVersion {
  constructor(
    private sheetRepository: ISheetRepository,
    private sheetVersionRepository: ISheetVersionRepository
  ) {}

  async execute(sheetId: string, versionId: string, input: RestoreSheetVersionInput): Promise<SheetOutput> {
    const version = await this.sheetVersionRepository.findById(versionId);
    if (!version) {
      throw new Error('SheetVersion not found');
    }

    const sheet = await this.sheetRepository.findById(sheetId);
    if (!sheet) {
      throw new Error('Sheet not found');
    }

    if (version.sheetId !== sheet.id) {
      throw new Error('SheetVersion does not belong to the specified sheet');
    }

    const restoredSheet = Sheet.reconstruct(
      sheet.id,
      sheet.projectId,
      version.name,
      version.description,
      version.content,
      version.imageUrl,
      sheet.createdAt,
      new Date()
    );

    const savedSheet = await this.sheetRepository.save(restoredSheet);

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

