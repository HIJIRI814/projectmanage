import { Sheet } from './Sheet';

export interface ISheetRepository {
  findById(id: string): Promise<Sheet | null>;
  findByProjectId(projectId: string): Promise<Sheet[]>;
  save(sheet: Sheet): Promise<Sheet>;
  delete(id: string): Promise<void>;
}

