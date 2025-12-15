import { ISheetRepository } from '../../domain/sheet/model/ISheetRepository';
import { Sheet } from '../../domain/sheet/model/Sheet';
import { prismaClient } from '../prisma/prismaClient';

export class SheetRepositoryImpl implements ISheetRepository {
  async findById(id: string): Promise<Sheet | null> {
    const sheetData = await prismaClient.sheet.findUnique({
      where: { id },
    });

    if (!sheetData) {
      return null;
    }

    return Sheet.reconstruct(
      sheetData.id,
      sheetData.projectId,
      sheetData.name,
      sheetData.description,
      sheetData.content,
      sheetData.imageUrl,
      sheetData.createdAt,
      sheetData.updatedAt
    );
  }

  async findByProjectId(projectId: string): Promise<Sheet[]> {
    const sheetsData = await prismaClient.sheet.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return sheetsData.map((sheetData) =>
      Sheet.reconstruct(
        sheetData.id,
        sheetData.projectId,
        sheetData.name,
        sheetData.description,
        sheetData.content,
        sheetData.imageUrl,
        sheetData.createdAt,
        sheetData.updatedAt
      )
    );
  }

  async save(sheet: Sheet): Promise<Sheet> {
    const sheetData = await prismaClient.sheet.upsert({
      where: { id: sheet.id },
      update: {
        name: sheet.name,
        description: sheet.description,
        content: sheet.content,
        imageUrl: sheet.imageUrl,
        updatedAt: new Date(),
      },
      create: {
        id: sheet.id,
        projectId: sheet.projectId,
        name: sheet.name,
        description: sheet.description,
        content: sheet.content,
        imageUrl: sheet.imageUrl,
        createdAt: sheet.createdAt,
        updatedAt: sheet.updatedAt,
      },
    });

    return Sheet.reconstruct(
      sheetData.id,
      sheetData.projectId,
      sheetData.name,
      sheetData.description,
      sheetData.content,
      sheetData.imageUrl,
      sheetData.createdAt,
      sheetData.updatedAt
    );
  }

  async delete(id: string): Promise<void> {
    await prismaClient.sheet.delete({
      where: { id },
    });
  }
}

