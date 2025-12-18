import { SheetMarkerRepositoryImpl } from '~/infrastructure/sheet/sheetMarkerRepositoryImpl';
import { SheetRepositoryImpl } from '~/infrastructure/sheet/sheetRepositoryImpl';
import { CreateSheetMarker } from '~/application/sheet/useCases/CreateSheetMarker';
import { CreateSheetMarkerInput } from '~/application/sheet/dto/CreateSheetMarkerInput';
import { JwtService } from '~/infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '~/infrastructure/auth/userRepositoryImpl';
import { UserCompanyRepositoryImpl } from '~/infrastructure/user/userCompanyRepositoryImpl';
import { UserType } from '~/domain/user/model/UserType';
import { z } from 'zod';

const sheetMarkerRepository = new SheetMarkerRepositoryImpl();
const sheetRepository = new SheetRepositoryImpl();
const createSheetMarkerUseCase = new CreateSheetMarker(sheetMarkerRepository, sheetRepository);
const userRepository = new UserRepositoryImpl();
const userCompanyRepository = new UserCompanyRepositoryImpl();
const jwtService = new JwtService();

const createSheetMarkerSchema = z.object({
  type: z.enum(['number', 'square']),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(0).max(100).optional().nullable(),
  height: z.number().min(0).max(100).optional().nullable(),
  note: z.string().optional().nullable(),
});

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

async function getUserTypeInAnyCompany(userId: string): Promise<number | null> {
  const userCompanies = await userCompanyRepository.findByUserId(userId);
  if (userCompanies.length === 0) {
    return null;
  }
  return userCompanies[0].userType.toNumber();
}

function isAdministratorOrMember(userType: number): boolean {
  return userType === UserType.ADMINISTRATOR || userType === UserType.MEMBER;
}

export default defineEventHandler(async (event) => {
  // #region agent log
  const logData = {location:'markers/index.post.ts:handler',message:'API handler called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
  await fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
  // #endregion
  
  const currentUser = await getCurrentUser(event);

  // #region agent log
  await fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'markers/index.post.ts:handler',message:'User authenticated',data:{userId:currentUser.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  const userType = await getUserTypeInAnyCompany(currentUser.id);
  if (!userType || !isAdministratorOrMember(userType)) {
    // #region agent log
    await fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'markers/index.post.ts:handler',message:'Permission denied',data:{userType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Administrator or Member access required',
    });
  }

  const sheetId = getRouterParam(event, 'sheetId');
  if (!sheetId) {
    // #region agent log
    await fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'markers/index.post.ts:handler',message:'Sheet ID missing',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    throw createError({
      statusCode: 400,
      statusMessage: 'Sheet ID is required',
    });
  }

  const body = await readBody(event);

  // #region agent log
  await fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'markers/index.post.ts:handler',message:'Request body received',data:{body,sheetId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  try {
    const validationResult = createSheetMarkerSchema.safeParse(body);
    if (!validationResult.success) {
      // #region agent log
      await fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'markers/index.post.ts:handler',message:'Validation failed',data:{errors:validationResult.error.errors,body},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: validationResult.error.errors,
      });
    }

    const input = new CreateSheetMarkerInput(
      validationResult.data.type,
      validationResult.data.x,
      validationResult.data.y,
      validationResult.data.width ?? null,
      validationResult.data.height ?? null,
      validationResult.data.note ?? null
    );

    // #region agent log
    await fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'markers/index.post.ts:handler',message:'Before use case execution',data:{input,sheetId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    const result = await createSheetMarkerUseCase.execute(sheetId, input);

    // #region agent log
    await fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'markers/index.post.ts:handler',message:'Use case succeeded',data:{resultId:result.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    return result;
  } catch (error: any) {
    // #region agent log
    await fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'markers/index.post.ts:handler',message:'Error caught',data:{errorMessage:error.message,errorStatus:error.statusCode,errorStack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (error.message === 'Sheet not found') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Sheet not found',
      });
    }

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    });
  }
});

