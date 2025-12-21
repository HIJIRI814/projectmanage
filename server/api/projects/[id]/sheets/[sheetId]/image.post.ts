import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { SheetRepositoryImpl } from '~/infrastructure/sheet/sheetRepositoryImpl';
import { UserCompanyRepositoryImpl } from '~/infrastructure/user/userCompanyRepositoryImpl';
import { UserType } from '~/domain/user/model/UserType';
import { Sheet } from '~/domain/sheet/model/Sheet';
import { getCurrentUser } from '~/server/utils/getCurrentUser';
import { createServerSupabaseClient } from '~/server/utils/supabase';

const sheetRepository = new SheetRepositoryImpl();
const userCompanyRepository = new UserCompanyRepositoryImpl();

const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const STORAGE_BUCKET = 'sheets';

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

  const form = await readMultipartFormData(event);
  
  // filenameがなくてもdataがあれば受け入れる
  const file = form?.find((part) => part.name === 'file' && part.data);

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

  // Supabase Storageにアップロード
  const supabase = createServerSupabaseClient(event);
  const filePath = `${sheetId}/${filename}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: file.type || 'image/png',
      upsert: false,
    });

  if (uploadError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to upload image: ${uploadError.message}`,
    });
  }

  // 公開URLを取得
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  const imageUrl = urlData.publicUrl;

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


