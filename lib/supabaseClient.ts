import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY; // Optional service role key

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anon key are required.');
}

// Regular client for most operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to bypass RLS for development/testing purposes
// This should be used ONLY in development environments!
export const bypassRLS = async (table: string, data: any) => {
  // If we have a service key and are in development, use it to bypass RLS
  if (supabaseServiceKey && import.meta.env.DEV) {
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    return await adminClient.from(table).insert(data);
  }
  
  // Otherwise use the regular client
  return await supabase.from(table).insert(data);
};
