export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://fqmvpfpepuduifkzgdnd.supabase.co';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_nVB2wgfK4i8KxkDYgSxVYA_ZOZFWh1R';

export const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.startsWith('COLE_')
);

export const isGroqAvailable = Boolean(GROQ_API_KEY && !GROQ_API_KEY.startsWith('COLE_'));
