import { ISheetMarkerRepository } from '~domain/sheet/model/ISheetMarkerRepository';
import { SheetMarkerOutput } from '../dto/SheetMarkerOutput';

export class GetSheetMarkers {
  constructor(private sheetMarkerRepository: ISheetMarkerRepository) {}

  async execute(sheetId: string, sheetVersionId: string | null): Promise<SheetMarkerOutput[]> {
    const markers = await this.sheetMarkerRepository.findBySheetId(sheetId, sheetVersionId);

    return markers.map(
      (marker) =>
        new SheetMarkerOutput(
          marker.id,
          marker.sheetId,
          marker.sheetVersionId,
          marker.type,
          marker.x,
          marker.y,
          marker.width,
          marker.height,
          marker.note,
          marker.createdAt,
          marker.updatedAt
        )
    );
  }
}

