import { ISheetMarkerRepository } from '~domain/sheet/model/ISheetMarkerRepository';
import { SheetMarker } from '~domain/sheet/model/SheetMarker';
import { UpdateSheetMarkerInput } from '../dto/UpdateSheetMarkerInput';
import { SheetMarkerOutput } from '../dto/SheetMarkerOutput';

export class UpdateSheetMarker {
  constructor(private sheetMarkerRepository: ISheetMarkerRepository) {}

  async execute(markerId: string, input: UpdateSheetMarkerInput): Promise<SheetMarkerOutput> {
    const marker = await this.sheetMarkerRepository.findById(markerId);
    if (!marker) {
      throw new Error('Marker not found');
    }

    const updatedMarker = SheetMarker.reconstruct(
      marker.id,
      marker.sheetId,
      marker.sheetVersionId,
      marker.type,
      input.x !== null ? input.x : marker.x,
      input.y !== null ? input.y : marker.y,
      input.width !== null ? input.width : marker.width,
      input.height !== null ? input.height : marker.height,
      input.note !== null ? input.note : marker.note,
      marker.createdAt,
      new Date()
    );

    const savedMarker = await this.sheetMarkerRepository.save(updatedMarker);

    return new SheetMarkerOutput(
      savedMarker.id,
      savedMarker.sheetId,
      savedMarker.sheetVersionId,
      savedMarker.type,
      savedMarker.x,
      savedMarker.y,
      savedMarker.width,
      savedMarker.height,
      savedMarker.note,
      savedMarker.createdAt,
      savedMarker.updatedAt
    );
  }
}

