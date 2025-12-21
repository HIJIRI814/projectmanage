import { createClientSupabaseClient } from '~/server/utils/supabase';
import { UserRepositoryImpl } from '~infrastructure/auth/userRepositoryImpl';
import { UserCompanyRepositoryImpl } from '~infrastructure/user/userCompanyRepositoryImpl';

const userRepository = new UserRepositoryImpl();
const userCompanyRepository = new UserCompanyRepositoryImpl();

export default defineEventHandler(async (event) => {
  const supabase = createClientSupabaseClient(event);
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  const userId = session.user.id;
  const user = await userRepository.findById(userId);
  
  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
    });
  }

  // UserCompanyからuserTypeを取得（最初の会社のuserTypeを使用）
  const userCompanies = await userCompanyRepository.findByUserId(userId);
  const userType = userCompanies.length > 0 ? userCompanies[0].userType.toNumber() : null;

  return {
    id: user.id,
    email: user.email.toString(),
    name: user.name,
    userType,
    userCompanies: userCompanies.map((uc) => ({
      id: uc.id,
      companyId: uc.companyId,
      userType: uc.userType.toNumber(),
    })),
  };
});

