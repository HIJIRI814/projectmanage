import { UserRepositoryImpl } from '../../../../infrastructure/auth/userRepositoryImpl';
import { UserCompanyRepositoryImpl } from '../../../../infrastructure/user/userCompanyRepositoryImpl';
import { ListUsers } from '../../../../application/user/useCases/ListUsers';
import { UserType } from '../../../../domain/user/model/UserType';
import { getCurrentUser } from '~/server/utils/getCurrentUser';

const userRepository = new UserRepositoryImpl();
const userCompanyRepository = new UserCompanyRepositoryImpl();
const listUsersUseCase = new ListUsers(userRepository, userCompanyRepository);

async function isAdministratorInAnyCompany(userId: string): Promise<boolean> {
  const userCompanies = await userCompanyRepository.findByUserId(userId);
  if (userCompanies.length === 0) {
    return false;
  }
  // いずれかの会社でADMINISTRATORであるかをチェック
  return userCompanies.some(
    (uc) => uc.userType.toNumber() === UserType.ADMINISTRATOR
  );
}

async function checkAdministratorAccess(event: any) {
  const user = await getCurrentUser(event);
  const isAdministrator = await isAdministratorInAnyCompany(user.id);
  if (!isAdministrator) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Administrator access required',
    });
  }
  return user;
}

export default defineEventHandler(async (event) => {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/5bb52b61-727f-4e41-8e72-bb69d23dc924',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/api/manage/users/index.get.ts:43',message:'API entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  // 管理者権限チェック
  try {
    const currentUser = await checkAdministratorAccess(event);
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/5bb52b61-727f-4e41-8e72-bb69d23dc924',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/api/manage/users/index.get.ts:47',message:'Admin check passed',data:{userId:currentUser.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/5bb52b61-727f-4e41-8e72-bb69d23dc924',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/api/manage/users/index.get.ts:51',message:'Admin check failed',data:{errorMessage:error.message,statusCode:error.statusCode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    throw error;
  }

  // ユーザー一覧取得
  const users = await listUsersUseCase.execute();
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/5bb52b61-727f-4e41-8e72-bb69d23dc924',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/api/manage/users/index.get.ts:58',message:'Users list retrieved',data:{userCount:users.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  return users;
});

