export interface IImageBackupService {
  /**
   * 画像ファイルをバックアップする
   * @param sourceImageUrl 元の画像URL（例: /uploads/sheets/image.png）
   * @returns バックアップされた画像のURL（例: /uploads/sheet-versions/image.png）
   */
  backupImage(sourceImageUrl: string | null): Promise<string | null>;
}

