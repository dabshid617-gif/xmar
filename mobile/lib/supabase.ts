import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const { supabaseUrl, supabaseAnonKey } = (Constants.expoConfig?.extra ?? {}) as {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration (supabaseUrl or supabaseAnonKey) in app.json extra.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
  },
});
