import { createClientSupabaseClient } from './supabase';
import { UserRepositoryImpl } from '~infrastructure/auth/userRepositoryImpl';

const userRepository = new UserRepositoryImpl();

export async function getCurrentUser(event: any) {
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
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  return user;
}

