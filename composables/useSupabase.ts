import { createClient } from '@supabase/supabase-js';

export const useSupabase = () => {
  const config = useRuntimeConfig();
  
  const supabaseUrl = config.public.supabaseUrl;
  const supabaseAnonKey = config.public.supabaseAnonKey;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return supabase;
};

