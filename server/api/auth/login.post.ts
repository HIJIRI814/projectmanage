import { createClientSupabaseClient } from '~/server/utils/supabase';
import { UserRepositoryImpl } from '~infrastructure/auth/userRepositoryImpl';
import { UserCompanyRepositoryImpl } from '~infrastructure/user/userCompanyRepositoryImpl';
import { User } from '~domain/user/model/User';
import { Email } from '~domain/user/model/Email';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const userRepository = new UserRepositoryImpl();
const userCompanyRepository = new UserCompanyRepositoryImpl();

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    // バリデーション
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues || [];
      const errorMessages = errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw createError({
        statusCode: 400,
        statusMessage: `Validation error: ${errorMessages}`,
        data: errors,
      });
    }

    // Supabaseクライアントの作成（ユーザー認証にはANON_KEYを使用）
    const supabase = createClientSupabaseClient(event);
    
    // Supabaseでログイン
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: validationResult.data.email,
      password: validationResult.data.password,
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      throw createError({
        statusCode: 401,
        statusMessage: authError.message || 'Invalid credentials',
      });
    }

    if (!authData.session) {
      console.error('No session returned from Supabase');
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials',
      });
    }

    // セッショントークンをクッキーに保存
    const isProduction = process.env.NODE_ENV === 'production';
    setCookie(event, 'sb-access-token', authData.session.access_token, {
      maxAge: 60 * 60, // 1時間
      secure: isProduction, // 本番環境のみHTTPS
      sameSite: 'lax',
      httpOnly: true,
      path: '/',
    });

    setCookie(event, 'sb-refresh-token', authData.session.refresh_token, {
      maxAge: 60 * 60 * 24 * 7, // 7日
      secure: isProduction,
      sameSite: 'lax',
      httpOnly: true,
      path: '/',
    });

    // ユーザー情報を取得
    const userId = authData.user.id;
    let user = await userRepository.findById(userId);
    
    // ユーザーが存在しない場合、Supabaseのユーザー情報から作成
    if (!user) {
      console.log(`User ${userId} not found in database, creating from Supabase user data`);
      const supabaseUser = authData.user;
      const userMetadata = supabaseUser.user_metadata || {};
      const email = new Email(supabaseUser.email || validationResult.data.email);
      
      // ダミーのパスワードハッシュ（実際の認証はSupabaseで行われる）
      const dummyPasswordHash = '$2a$10$dummy.hash.for.supabase.user.that.will.never.be.used';
      user = User.reconstruct(
        userId,
        email.toString(),
        dummyPasswordHash,
        userMetadata.name || supabaseUser.email?.split('@')[0] || 'User',
        new Date(supabaseUser.created_at || Date.now()),
        new Date()
      );
      await userRepository.save(user);
    }

    // UserCompanyからuserTypeを取得（最初の会社のuserTypeを使用）
    const userCompanies = await userCompanyRepository.findByUserId(userId);
    const userType = userCompanies.length > 0 ? userCompanies[0].userType.toNumber() : null;

    return {
      user: {
        id: user.id,
        email: user.email.toString(),
        name: user.name,
        userType,
        userCompanies: userCompanies.map((uc) => ({
          id: uc.id,
          companyId: uc.companyId,
          userType: uc.userType.toNumber(),
        })),
      },
    };
  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: `Internal server error: ${error.message || 'Unknown error'}`,
      data: { originalError: error.message, stack: error.stack },
    });
  }
});

