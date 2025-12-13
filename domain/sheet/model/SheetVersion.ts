export class SheetVersion {
  private constructor(
    public readonly id: string,
    public readonly sheetId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly content: string | null,
    public readonly versionName: string,
    public readonly createdAt: Date
  ) {}

  static create(
    id: string,
    sheetId: string,
    name: string,
    description: string | null,
    content: string | null
  ): SheetVersion {
    const now = new Date();
    const versionName = SheetVersion.generateVersionName(now);
    return new SheetVersion(id, sheetId, name, description, content, versionName, now);
  }

  static reconstruct(
    id: string,
    sheetId: string,
    name: string,
    description: string | null,
    content: string | null,
    versionName: string,
    createdAt: Date
  ): SheetVersion {
    return new SheetVersion(id, sheetId, name, description, content, versionName, createdAt);
  }

  private static generateVersionName(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
}

