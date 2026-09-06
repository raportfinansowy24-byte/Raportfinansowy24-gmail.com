import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Provide fallback placeholder values so the app doesn't crash on load 
// if the environment variables are not set yet or are invalid.
let supabaseUrl = '';
let supabaseAnonKey = 'placeholder-key';

if (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_URL) {
  supabaseUrl = process.env.VITE_SUPABASE_URL;
  supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';
} else if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
  supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
  supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';
}

// Clean up quotes if the user accidentally included them in the env var
supabaseUrl = supabaseUrl.replace(/^["']|["']$/g, '');
supabaseAnonKey = supabaseAnonKey.replace(/^["']|["']$/g, '');

try {
  new URL(supabaseUrl);
} catch (e) {
  supabaseUrl = 'https://placeholder.supabase.co';
}

export const isSupabaseConfigured = supabaseUrl !== 'https://placeholder.supabase.co' && supabaseUrl !== '';

let isServiceReachable = true;

// Create a single supabase client for interacting with your database
let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
};

export const setSupabaseUnreachable = () => {
  if (isServiceReachable) {
    console.warn("[Supabase] Wykryto trwały błąd połączenia (ENOTFOUND). Przełączanie w tryb offline.");
    isServiceReachable = false;
  }
};

export const getIsSupabaseAvailable = () => isSupabaseConfigured && isServiceReachable;

export const supabase = getSupabase();
