import { ISheetMarkerRepository } from '../../../domain/sheet/model/ISheetMarkerRepository';

export class DeleteSheetMarker {
  constructor(private sheetMarkerRepository: ISheetMarkerRepository) {}

  async execute(markerId: string): Promise<void> {
    const marker = await this.sheetMarkerRepository.findById(markerId);
    if (!marker) {
      throw new Error('Marker not found');
    }

    await this.sheetMarkerRepository.delete(markerId);
  }
}

