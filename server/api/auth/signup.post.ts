import { createServerSupabaseClient } from '~/server/utils/supabase';
import { UserRepositoryImpl } from '~infrastructure/auth/userRepositoryImpl';
import { UserCompanyRepositoryImpl } from '~infrastructure/user/userCompanyRepositoryImpl';
import { User } from '~domain/user/model/User';
import { Email } from '~domain/user/model/Email';
import { z } from 'zod';

const userRepository = new UserRepositoryImpl();
const userCompanyRepository = new UserCompanyRepositoryImpl();

const signUpSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    const validationResult = signUpSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: validationResult.error.issues,
      });
    }

    // Supabaseクライアントの作成
    const supabase = createServerSupabaseClient(event);
    
    // Supabaseでサインアップ（service role keyを使用するためadmin.createUserを使用）
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: validationResult.data.email,
      password: validationResult.data.password,
      email_confirm: true, // メール確認をスキップ
      user_metadata: {
        name: validationResult.data.name,
      },
    });

    if (authError) {
      console.error('Supabase signup error:', authError);
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Email already exists',
        });
      }
      throw createError({
        statusCode: 400,
        statusMessage: authError.message || 'Sign up failed',
      });
    }

    if (!authData.user) {
      throw createError({
        statusCode: 500,
        statusMessage: 'User creation failed',
      });
    }

    // 既存のデータベースにユーザーを作成（SupabaseのユーザーIDを使用）
    // パスワードハッシュはSupabaseで管理されているため、ダミーのハッシュを使用
    // 実際の認証はSupabaseで行われるため、このハッシュは使用されない
    const supabaseUserId = authData.user.id;
    const email = new Email(validationResult.data.email);
    
    // 既に存在するかチェック
    const existingUser = await userRepository.findByEmail(email);
    if (!existingUser) {
      // SupabaseのユーザーIDを使用してユーザーを作成
      // パスワードハッシュはダミー（実際の認証はSupabaseで行われる）
      const dummyPasswordHash = '$2a$10$dummy.hash.for.supabase.user.that.will.never.be.used';
      const newUser = User.reconstruct(
        supabaseUserId,
        validationResult.data.email,
        dummyPasswordHash,
        validationResult.data.name,
        new Date(),
        new Date()
      );
      await userRepository.save(newUser);
    }

    // admin.createUserはセッションを返さないため、signInWithPasswordでセッションを取得
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: validationResult.data.email,
      password: validationResult.data.password,
    });

    if (sessionError || !sessionData.session) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create session after signup',
      });
    }

    // セッションをクッキーに保存
    const isProduction = process.env.NODE_ENV === 'production';
    setCookie(event, 'sb-access-token', sessionData.session.access_token, {
      maxAge: 60 * 60, // 1時間
      secure: isProduction, // 本番環境のみHTTPS
      sameSite: 'lax',
      httpOnly: true,
      path: '/',
    });

    setCookie(event, 'sb-refresh-token', sessionData.session.refresh_token, {
      maxAge: 60 * 60 * 24 * 7, // 7日
      secure: isProduction,
      sameSite: 'lax',
      httpOnly: true,
      path: '/',
    });

    // ユーザー情報を取得
    const user = await userRepository.findById(authData.user.id);
    
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      });
    }

    // UserCompanyからuserTypeを取得
    const userCompanies = await userCompanyRepository.findByUserId(user.id);
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
    console.error('Signup error:', error);
    
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

