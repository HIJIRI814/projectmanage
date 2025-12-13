import { ISheetVersionRepository } from '../../../domain/sheet/model/ISheetVersionRepository';
import { SheetVersionOutput } from '../dto/SheetVersionOutput';

export class GetSheetVersion {
  constructor(private sheetVersionRepository: ISheetVersionRepository) {}

  async execute(versionId: string): Promise<SheetVersionOutput> {
    const version = await this.sheetVersionRepository.findById(versionId);
    if (!version) {
      throw new Error('SheetVersion not found');
    }

    return new SheetVersionOutput(
      version.id,
      version.sheetId,
      version.name,
      version.description,
      version.content,
      version.versionName,
      version.createdAt
    );
  }
}

