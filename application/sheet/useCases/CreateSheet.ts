import { ISheetRepository } from '~domain/sheet/model/ISheetRepository';
import { Sheet } from '~domain/sheet/model/Sheet';
import { CreateSheetInput } from '../dto/CreateSheetInput';
import { SheetOutput } from '../dto/SheetOutput';
import { v4 as uuidv4 } from 'uuid';

export class CreateSheet {
  constructor(private sheetRepository: ISheetRepository) {}

  async execute(projectId: string, input: CreateSheetInput): Promise<SheetOutput> {
    const sheet = Sheet.create(
      uuidv4(),
      projectId,
      input.name,
      input.description || null,
      input.content || null,
      input.imageUrl || null
    );

    const savedSheet = await this.sheetRepository.save(sheet);

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

