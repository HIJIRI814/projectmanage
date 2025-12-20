import { ISheetVersionRepository } from '~domain/sheet/model/ISheetVersionRepository';
import { SheetVersionOutput } from '../dto/SheetVersionOutput';

export class ListSheetVersions {
  constructor(private sheetVersionRepository: ISheetVersionRepository) {}

  async execute(sheetId: string): Promise<SheetVersionOutput[]> {
    const versions = await this.sheetVersionRepository.findBySheetId(sheetId);

    return versions.map(
      (version) =>
        new SheetVersionOutput(
          version.id,
          version.sheetId,
          version.name,
          version.description,
          version.content,
          version.imageUrl,
          version.versionName,
          version.createdAt
        )
    );
  }
}

