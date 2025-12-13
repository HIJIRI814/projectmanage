import { SheetVersion } from './SheetVersion';

export interface ISheetVersionRepository {
  findById(id: string): Promise<SheetVersion | null>;
  findBySheetId(sheetId: string): Promise<SheetVersion[]>;
  save(version: SheetVersion): Promise<SheetVersion>;
  delete(id: string): Promise<void>;
}

