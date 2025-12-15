import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { IImageBackupService } from '../../domain/sheet/service/IImageBackupService';

export class ImageBackupService implements IImageBackupService {
  async backupImage(sourceImageUrl: string | null): Promise<string | null> {
    if (!sourceImageUrl) {
      return null;
    }

    // URLが空文字列の場合はnullを返す
    if (sourceImageUrl.trim() === '') {
      return null;
    }

    // 元の画像ファイルパスを取得
    const runtimeConfig = useRuntimeConfig();
    const publicBase =
      runtimeConfig.public?.sheetImageBaseUrl ||
      runtimeConfig.sheetImageBaseUrl ||
      '/uploads/sheets';
    
    // sourceImageUrlが既に絶対パスまたは完全なURLの場合は処理をスキップ
    if (sourceImageUrl.startsWith('http://') || sourceImageUrl.startsWith('https://')) {
      // 外部URLの場合はそのまま返す（バックアップしない）
      return sourceImageUrl;
    }

    // 相対パスから実際のファイルパスを取得
    const sourcePath = sourceImageUrl.startsWith(publicBase)
      ? sourceImageUrl.replace(publicBase, '')
      : sourceImageUrl.startsWith('/')
      ? sourceImageUrl
      : `/${sourceImageUrl}`;

    const uploadDir =
      runtimeConfig.public?.sheetImageUploadDir ||
      runtimeConfig.sheetImageUploadDir ||
      path.join('public', 'uploads', 'sheets');
    const uploadPath = path.isAbsolute(uploadDir)
      ? uploadDir
      : path.join(process.cwd(), uploadDir);

    const sourceFilePath = path.join(uploadPath, path.basename(sourcePath));

    // ファイルが存在するか確認
    try {
      await fs.access(sourceFilePath);
    } catch {
      // ファイルが存在しない場合はnullを返す
      return null;
    }

    // バックアップ先のディレクトリを設定
    const backupBaseUrl =
      runtimeConfig.public?.sheetVersionImageBaseUrl ||
      runtimeConfig.sheetVersionImageBaseUrl ||
      '/uploads/sheet-versions';
    
    const backupDir =
      runtimeConfig.public?.sheetVersionImageUploadDir ||
      runtimeConfig.sheetVersionImageUploadDir ||
      path.join('public', 'uploads', 'sheet-versions');
    const backupPath = path.isAbsolute(backupDir)
      ? backupDir
      : path.join(process.cwd(), backupDir);

    // バックアップディレクトリを作成
    await fs.mkdir(backupPath, { recursive: true });

    // ファイル拡張子を取得
    const ext = path.extname(sourceFilePath) || path.extname(sourceImageUrl) || '.png';
    const filename = `${uuidv4()}${ext}`;
    const backupFilePath = path.join(backupPath, filename);

    // ファイルをコピー
    await fs.copyFile(sourceFilePath, backupFilePath);

    // 公開パスを返す
    const backupImageUrl = path.posix.join(backupBaseUrl, filename);
    return backupImageUrl;
  }
}

