import { ISheetRepository } from '../../../domain/sheet/model/ISheetRepository';
import { SheetOutput } from '../dto/SheetOutput';

export class ListSheets {
  constructor(private sheetRepository: ISheetRepository) {}

  async execute(projectId: string): Promise<SheetOutput[]> {
    const sheets = await this.sheetRepository.findByProjectId(projectId);

    return sheets.map(
      (sheet) =>
        new SheetOutput(
          sheet.id,
          sheet.projectId,
          sheet.name,
          sheet.description,
          sheet.content,
          sheet.imageUrl,
          sheet.createdAt,
          sheet.updatedAt
        )
    );
  }
}

