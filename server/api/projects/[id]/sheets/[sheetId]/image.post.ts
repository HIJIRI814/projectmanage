import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { SheetRepositoryImpl } from '~/infrastructure/sheet/sheetRepositoryImpl';
import { UserCompanyRepositoryImpl } from '~/infrastructure/user/userCompanyRepositoryImpl';
import { UserType } from '~/domain/user/model/UserType';
import { Sheet } from '~/domain/sheet/model/Sheet';
import { getCurrentUser } from '~/server/utils/getCurrentUser';

const sheetRepository = new SheetRepositoryImpl();
const userCompanyRepository = new UserCompanyRepositoryImpl();

const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

async function getUserTypeInAnyCompany(userId: string): Promise<number | null> {
  const userCompanies = await userCompanyRepository.findByUserId(userId);
  if (userCompanies.length === 0) {
    return null;
  }
  // 最初の会社のuserTypeを返す（デフォルトとして）
  return userCompanies[0].userType.toNumber();
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
  // #region agent log
  try {
  // #endregion
  
  const currentUser = await getCurrentUser(event);

  // ユーザーのuserTypeを取得（最初の会社のuserTypeを使用）
  const userType = await getUserTypeInAnyCompany(currentUser.id);
  if (!userType || !isAdministratorOrMember(userType)) {
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

  // #region agent log
  const contentType = getHeader(event, 'content-type') || '';
  // #endregion
  
  const form = await readMultipartFormData(event);
  // #region agent log
  const logData = {
    contentType,
    formIsArray: Array.isArray(form),
    formLength: form?.length || 0,
    formParts: form?.map((part: any) => ({
      name: part.name,
      filename: part.filename,
      hasData: !!part.data,
      dataLength: part.data?.length || 0,
      type: part.type,
    })) || [],
  };
  await fs.appendFile(
    '/Users/hijiri/Develop/hijiri/nuxt/nuxt-app/.cursor/debug.log',
    JSON.stringify({
      location: 'image.post.ts:readMultipartFormData',
      message: 'Multipart form data read',
      data: logData,
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'H4',
    }) + '\n'
  ).catch(() => {});
  // #endregion
  
  // filenameがなくてもdataがあれば受け入れる
  const file = form?.find((part) => part.name === 'file' && part.data);

  if (!file || !file.data) {
    // #region agent log
    await fs.appendFile(
      '/Users/hijiri/Develop/hijiri/nuxt/nuxt-app/.cursor/debug.log',
      JSON.stringify({
        location: 'image.post.ts:file-check',
        message: 'File not found in form data',
        data: { hasFile: !!file, hasFileData: !!file?.data, formLength: form?.length || 0 },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'post-fix',
        hypothesisId: 'H4',
      }) + '\n'
    ).catch(() => {});
    // #endregion
    throw createError({ statusCode: 400, statusMessage: 'File is required' });
  }
  
  // #region agent log
  await fs.appendFile(
    '/Users/hijiri/Develop/hijiri/nuxt/nuxt-app/.cursor/debug.log',
    JSON.stringify({
      location: 'image.post.ts:file-found',
      message: 'File found in form data',
      data: { hasFile: !!file, hasFileData: !!file?.data, hasFilename: !!file?.filename, filename: file?.filename },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'post-fix',
      hypothesisId: 'H4',
    }) + '\n'
  ).catch(() => {});
  // #endregion

  if (!ALLOWED_MIME_TYPES.has(file.type || '')) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported file type' });
  }

  const fileBuffer = file.data as Buffer;
  if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'File is too large' });
  }

  const ext = getExtension(file.filename, file.type);
  const filename = `${uuidv4()}${ext || '.bin'}`;
  
  // #region agent log
  await fs.appendFile(
    '/Users/hijiri/Develop/hijiri/nuxt/nuxt-app/.cursor/debug.log',
    JSON.stringify({
      location: 'image.post.ts:before-save',
      message: 'Before file save',
      data: { ext, filename, fileType: file.type, fileBufferLength: fileBuffer.length },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'post-fix',
      hypothesisId: 'H5',
    }) + '\n'
  ).catch(() => {});
  // #endregion

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
  
  // #region agent log
  await fs.appendFile(
    '/Users/hijiri/Develop/hijiri/nuxt/nuxt-app/.cursor/debug.log',
    JSON.stringify({
      location: 'image.post.ts:writeFile-complete',
      message: 'File write completed',
      data: { filePath },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'post-fix',
      hypothesisId: 'H5',
    }) + '\n'
  ).catch(() => {});
  // #endregion

  // 公開パスを決定（public/以下に置く場合は先頭に/を付けて返す）
  const publicBase =
    runtimeConfig.public?.sheetImageBaseUrl ||
    runtimeConfig.sheetImageBaseUrl ||
    '/uploads/sheets';
  const imageUrl = path.posix.join(publicBase, filename);
  
  // #region agent log
  await fs.appendFile(
    '/Users/hijiri/Develop/hijiri/nuxt/nuxt-app/.cursor/debug.log',
    JSON.stringify({
      location: 'image.post.ts:after-save',
      message: 'File saved',
      data: { filePath, imageUrl },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'post-fix',
      hypothesisId: 'H5',
    }) + '\n'
  ).catch(() => {});
  // #endregion

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
  
  // #region agent log
  await fs.appendFile(
    '/Users/hijiri/Develop/hijiri/nuxt/nuxt-app/.cursor/debug.log',
    JSON.stringify({
      location: 'image.post.ts:success',
      message: 'Image upload successful',
      data: { sheetId: savedSheet.id, imageUrl: savedSheet.imageUrl },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'post-fix',
      hypothesisId: 'H5',
    }) + '\n'
  ).catch(() => {});
  // #endregion

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
  // #region agent log
  } catch (error: any) {
    await fs.appendFile(
      '/Users/hijiri/Develop/hijiri/nuxt/nuxt-app/.cursor/debug.log',
      JSON.stringify({
        location: 'image.post.ts:error',
        message: 'Error in image upload',
        data: { 
          errorMessage: error.message,
          errorStatus: error.statusCode,
          errorStatusMessage: error.statusMessage,
          stack: error.stack?.split('\n').slice(0, 5),
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'post-fix',
        hypothesisId: 'H5',
      }) + '\n'
    ).catch(() => {});
    throw error;
  }
  // #endregion
});


