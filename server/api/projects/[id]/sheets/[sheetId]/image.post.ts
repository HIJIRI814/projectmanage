import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { SheetRepositoryImpl } from '~/infrastructure/sheet/sheetRepositoryImpl';
import { JwtService } from '~/infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '~/infrastructure/auth/userRepositoryImpl';
import { UserType } from '~/domain/user/model/UserType';
import { Sheet } from '~/domain/sheet/model/Sheet';

const sheetRepository = new SheetRepositoryImpl();
const userRepository = new UserRepositoryImpl();
const jwtService = new JwtService();

const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

async function getCurrentUser(event: any) {
  const accessTokenCookie = getCookie(event, 'accessToken');
  if (!accessTokenCookie) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  try {
    const { userId } = jwtService.verifyAccessToken(accessTokenCookie);
    const user = await userRepository.findById(userId);

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      });
    }

    return user;
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }
}

function isAdministratorOrMember(userType: number): boolean {
  return userType === UserType.ADMINISTRATOR || userType === UserType.MEMBER;
}

function ensureUploadDir(uploadDir: string) {
  return fs.mkdir(uploadDir, { recursive: true });
}

function getExtension(filename?: string, type?: string): string {
  if (filename) {
    const ext = path.extname(filename);
    if (ext) {
      return ext;
    }
  }
  if (type === 'image/png') return '.png';
  if (type === 'image/jpeg') return '.jpg';
  if (type === 'image/webp') return '.webp';
  if (type === 'image/gif') return '.gif';
  return '';
}

export default defineEventHandler(async (event) => {
  const currentUser = await getCurrentUser(event);

  // 管理者・メンバーのみアクセス可能
  if (!isAdministratorOrMember(currentUser.userType.toNumber())) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Administrator or Member access required',
    });
  }

  const projectId = getRouterParam(event, 'id');
  const sheetId = getRouterParam(event, 'sheetId');
  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project ID is required' });
  }
  if (!sheetId) {
    throw createError({ statusCode: 400, statusMessage: 'Sheet ID is required' });
  }

  const sheet = await sheetRepository.findById(sheetId);
  if (!sheet || sheet.projectId !== projectId) {
    throw createError({ statusCode: 404, statusMessage: 'Sheet not found' });
  }

  const form = await readMultipartFormData(event);
  const file = form?.find((part) => part.name === 'file' && part.filename);

  if (!file || !file.data) {
    throw createError({ statusCode: 400, statusMessage: 'File is required' });
  }

  if (!ALLOWED_MIME_TYPES.has(file.type || '')) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported file type' });
  }

  const fileBuffer = file.data as Buffer;
  if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'File is too large' });
  }

  const ext = getExtension(file.filename, file.type);
  const filename = `${uuidv4()}${ext || '.bin'}`;

  const runtimeConfig = useRuntimeConfig();
  const uploadDir =
    runtimeConfig.public?.sheetImageUploadDir ||
    runtimeConfig.sheetImageUploadDir ||
    path.join('public', 'uploads', 'sheets');
  const uploadPath = path.isAbsolute(uploadDir)
    ? uploadDir
    : path.join(process.cwd(), uploadDir);

  await ensureUploadDir(uploadPath);

  const filePath = path.join(uploadPath, filename);
  await fs.writeFile(filePath, fileBuffer);

  // 公開パスを決定（public/以下に置く場合は先頭に/を付けて返す）
  const publicBase =
    runtimeConfig.public?.sheetImageBaseUrl ||
    runtimeConfig.sheetImageBaseUrl ||
    '/uploads/sheets';
  const imageUrl = path.posix.join(publicBase, filename);

  const updatedSheet = Sheet.reconstruct(
    sheet.id,
    sheet.projectId,
    sheet.name,
    sheet.description,
    sheet.content,
    imageUrl,
    sheet.createdAt,
    new Date()
  );

  const savedSheet = await sheetRepository.save(updatedSheet);

  return {
    id: savedSheet.id,
    projectId: savedSheet.projectId,
    name: savedSheet.name,
    description: savedSheet.description,
    content: savedSheet.content,
    imageUrl: savedSheet.imageUrl,
    createdAt: savedSheet.createdAt,
    updatedAt: savedSheet.updatedAt,
  };
});


