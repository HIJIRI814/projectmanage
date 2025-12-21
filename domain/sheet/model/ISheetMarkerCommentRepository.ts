import { SheetMarkerComment } from './SheetMarkerComment';

export interface ISheetMarkerCommentRepository {
  save(comment: SheetMarkerComment): Promise<SheetMarkerComment>;
  findByMarkerId(markerId: string): Promise<SheetMarkerComment[]>;
  findById(id: string): Promise<SheetMarkerComment | null>;
}

