import { ISheetMarkerRepository } from '../../domain/sheet/model/ISheetMarkerRepository';
import { SheetMarker } from '../../domain/sheet/model/SheetMarker';
import { prismaClient } from '../prisma/prismaClient';
import { v4 as uuidv4 } from 'uuid';

export class SheetMarkerRepositoryImpl implements ISheetMarkerRepository {
  async findById(id: string): Promise<SheetMarker | null> {
    const markerData = await prismaClient.sheetMarker.findUnique({
      where: { id },
    });

    if (!markerData) {
      return null;
    }

    return SheetMarker.reconstruct(
      markerData.id,
      markerData.sheetId,
      markerData.sheetVersionId,
      markerData.type as 'number' | 'square',
      markerData.x,
      markerData.y,
      markerData.width,
      markerData.height,
      markerData.note,
      markerData.createdAt,
      markerData.updatedAt
    );
  }

  async findBySheetId(sheetId: string, sheetVersionId: string | null): Promise<SheetMarker[]> {
    const markersData = await prismaClient.sheetMarker.findMany({
      where: {
        sheetId,
        sheetVersionId,
      },
      orderBy: { y: 'asc' },
    });

    return markersData.map((markerData) =>
      SheetMarker.reconstruct(
        markerData.id,
        markerData.sheetId,
        markerData.sheetVersionId,
        markerData.type as 'number' | 'square',
        markerData.x,
        markerData.y,
        markerData.width,
        markerData.height,
        markerData.note,
        markerData.createdAt,
        markerData.updatedAt
      )
    );
  }

  async save(marker: SheetMarker): Promise<SheetMarker> {
    const markerData = await prismaClient.sheetMarker.upsert({
      where: { id: marker.id },
      update: {
        type: marker.type,
        x: marker.x,
        y: marker.y,
        width: marker.width,
        height: marker.height,
        note: marker.note,
        updatedAt: new Date(),
      },
      create: {
        id: marker.id,
        sheetId: marker.sheetId,
        sheetVersionId: marker.sheetVersionId,
        type: marker.type,
        x: marker.x,
        y: marker.y,
        width: marker.width,
        height: marker.height,
        note: marker.note,
        createdAt: marker.createdAt,
        updatedAt: marker.updatedAt,
      },
    });

    return SheetMarker.reconstruct(
      markerData.id,
      markerData.sheetId,
      markerData.sheetVersionId,
      markerData.type as 'number' | 'square',
      markerData.x,
      markerData.y,
      markerData.width,
      markerData.height,
      markerData.note,
      markerData.createdAt,
      markerData.updatedAt
    );
  }

  async delete(id: string): Promise<void> {
    await prismaClient.sheetMarker.delete({
      where: { id },
    });
  }

  async copyMarkersForVersion(sheetId: string, sheetVersionId: string): Promise<void> {
    const currentMarkers = await this.findBySheetId(sheetId, null);

    for (const marker of currentMarkers) {
      const newMarker = SheetMarker.create(
        uuidv4(),
        sheetId,
        sheetVersionId,
        marker.type,
        marker.x,
        marker.y,
        marker.width,
        marker.height,
        marker.note
      );
      await this.save(newMarker);
    }
  }
}

