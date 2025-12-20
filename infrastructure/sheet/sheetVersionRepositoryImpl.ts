import { ISheetVersionRepository } from '~domain/sheet/model/ISheetVersionRepository';
import { SheetVersion } from '~domain/sheet/model/SheetVersion';
import { prismaClient } from '../prisma/prismaClient';

export class SheetVersionRepositoryImpl implements ISheetVersionRepository {
  async findById(id: string): Promise<SheetVersion | null> {
    const versionData = await prismaClient.sheetVersion.findUnique({
      where: { id },
    });

    if (!versionData) {
      return null;
    }

    return SheetVersion.reconstruct(
      versionData.id,
      versionData.sheetId,
      versionData.name,
      versionData.description,
      versionData.content,
      versionData.imageUrl,
      versionData.versionName,
      versionData.createdAt
    );
  }

  async findBySheetId(sheetId: string): Promise<SheetVersion[]> {
    const versionsData = await prismaClient.sheetVersion.findMany({
      where: { sheetId },
      orderBy: { createdAt: 'desc' },
    });

    return versionsData.map((versionData) =>
      SheetVersion.reconstruct(
        versionData.id,
        versionData.sheetId,
        versionData.name,
        versionData.description,
        versionData.content,
        versionData.imageUrl,
        versionData.versionName,
        versionData.createdAt
      )
    );
  }

  async save(version: SheetVersion): Promise<SheetVersion> {
    const versionData = await prismaClient.sheetVersion.create({
      data: {
        id: version.id,
        sheetId: version.sheetId,
        name: version.name,
        description: version.description,
        content: version.content,
        imageUrl: version.imageUrl,
        versionName: version.versionName,
        createdAt: version.createdAt,
      },
    });

    return SheetVersion.reconstruct(
      versionData.id,
      versionData.sheetId,
      versionData.name,
      versionData.description,
      versionData.content,
      versionData.imageUrl,
      versionData.versionName,
      versionData.createdAt
    );
  }

  async delete(id: string): Promise<void> {
    await prismaClient.sheetVersion.delete({
      where: { id },
    });
  }
}

