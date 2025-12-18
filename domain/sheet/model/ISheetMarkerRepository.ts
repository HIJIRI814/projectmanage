import { SheetMarker } from './SheetMarker';

export interface ISheetMarkerRepository {
  findById(id: string): Promise<SheetMarker | null>;
  findBySheetId(sheetId: string, sheetVersionId: string | null): Promise<SheetMarker[]>;
  save(marker: SheetMarker): Promise<SheetMarker>;
  delete(id: string): Promise<void>;
  copyMarkersForVersion(sheetId: string, sheetVersionId: string): Promise<void>;
}

