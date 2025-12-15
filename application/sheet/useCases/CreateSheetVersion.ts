import { ISheetRepository } from '../../../domain/sheet/model/ISheetRepository';
import { ISheetVersionRepository } from '../../../domain/sheet/model/ISheetVersionRepository';
import { IImageBackupService } from '../../../domain/sheet/service/IImageBackupService';
import { SheetVersion } from '../../../domain/sheet/model/SheetVersion';
import { CreateSheetVersionInput } from '../dto/CreateSheetVersionInput';
import { SheetVersionOutput } from '../dto/SheetVersionOutput';
import { v4 as uuidv4 } from 'uuid';

export class CreateSheetVersion {
  constructor(
    private sheetRepository: ISheetRepository,
    private sheetVersionRepository: ISheetVersionRepository,
    private imageBackupService: IImageBackupService
  ) {}

  async execute(sheetId: string, input: CreateSheetVersionInput): Promise<SheetVersionOutput> {
    const sheet = await this.sheetRepository.findById(sheetId);
    if (!sheet) {
      throw new Error('Sheet not found');
    }

    // 画像をバックアップ
    const backedUpImageUrl = await this.imageBackupService.backupImage(sheet.imageUrl);

    const version = SheetVersion.create(
      uuidv4(),
      sheet.id,
      sheet.name,
      sheet.description,
      sheet.content,
      backedUpImageUrl
    );

    const savedVersion = await this.sheetVersionRepository.save(version);

    return new SheetVersionOutput(
      savedVersion.id,
      savedVersion.sheetId,
      savedVersion.name,
      savedVersion.description,
      savedVersion.content,
      savedVersion.imageUrl,
      savedVersion.versionName,
      savedVersion.createdAt
    );
  }
}

