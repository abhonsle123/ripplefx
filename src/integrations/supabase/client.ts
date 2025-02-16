
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://pqxzzviqodstimvybgow.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxeHp6dmlxb2RzdGltdnliZ293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5NjY5NDgsImV4cCI6MjA1NDU0Mjk0OH0.YpbMsDZ4We5o6d9lqj0gBEIfB7iy3qZHA2nt74gTrcY";

// Create Supabase client with persistent session handling
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true, // Enable session persistence
    storageKey: 'app-auth', // Custom storage key
    storage: window.localStorage, // Use localStorage for session persistence
    autoRefreshToken: true, // Enable automatic token refresh
    detectSessionInUrl: true, // Detect session in URL for OAuth
  },
});
