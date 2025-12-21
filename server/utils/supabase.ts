import { createClient } from '@supabase/supabase-js';

export const createServerSupabaseClient = (event: any) => {
  const config = useRuntimeConfig();
  
  const supabaseUrl = config.supabaseUrl;
  const supabaseServiceRoleKey = config.supabaseServiceRoleKey;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabase;
};

export const createClientSupabaseClient = (event: any) => {
  const config = useRuntimeConfig();
  
  const supabaseUrl = config.public.supabaseUrl;
  const supabaseAnonKey = config.public.supabaseAnonKey;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const accessToken = getCookie(event, 'sb-access-token');
  const refreshToken = getCookie(event, 'sb-refresh-token');

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: accessToken ? {
        Authorization: `Bearer ${accessToken}`,
      } : {},
    },
  });

  if (accessToken && refreshToken) {
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    } as any);
  }

  return supabase;
};

