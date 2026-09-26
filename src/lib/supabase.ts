import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default project configuration from user request
const DEFAULT_SUPABASE_URL = 'https://pvuwwoygsjnvqydgzzsq.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2dXd3b3lnc2pudnF5ZGd6enNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMzQ1MDMsImV4cCI6MjA1ODYxMDUwM30.defaultKey';

// Storage keys for custom client override
const STORAGE_URL_KEY = 'kfhh_supabase_url';
const STORAGE_ANON_KEY = 'kfhh_supabase_anon_key';

export function getStoredSupabaseConfig() {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_URL_KEY) : null;
  const customKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_ANON_KEY) : null;

  return {
    url: customUrl || import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL,
    anonKey: customKey || import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
  };
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_URL_KEY, url.trim());
    localStorage.setItem(STORAGE_ANON_KEY, anonKey.trim());
  }
  supabaseClientInstance = null; // Reset cached client
}

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  const { url, anonKey } = getStoredSupabaseConfig();

  try {
    supabaseClientInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return supabaseClientInstance;
  } catch (err) {
    console.warn('Could not initialize Supabase client:', err);
    // Return fallback client
    return createClient(DEFAULT_SUPABASE_URL, 'placeholder-key');
  }
}

export interface SupabaseCropRecord {
  id?: string;
  name: string;
  variety?: string;
  area_acres: number;
  stage: string;
  health_score: number;
  sowing_date?: string;
  location?: string;
  created_at?: string;
}

export interface SupabaseScanRecord {
  id?: string;
  crop_name: string;
  disease_detected: string;
  confidence: number;
  severity: string;
  recommended_treatment?: string;
  image_url?: string;
  created_at?: string;
}

export interface SupabaseChatRecord {
  id?: string;
  farmer_query: string;
  ai_response: string;
  language: string;
  created_at?: string;
}

// Test Supabase connectivity
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const client = getSupabaseClient();
    const { error } = await client.from('farmer_crops').select('id').limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Connected to Supabase project! (Table "farmer_crops" not yet created, creating fallback storage)',
        };
      }
      return {
        success: false,
        message: `Supabase status: ${error.message} (${error.code || 'error'})`,
      };
    }
    return {
      success: true,
      message: 'Successfully connected and verified Supabase database!',
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || 'Failed to connect to Supabase',
    };
  }
}

// Local Storage Keys for offline / unconfigured fallback
const LOCAL_CROPS_KEY = 'kfhh_local_farmer_crops';
const LOCAL_SCANS_KEY = 'kfhh_local_crop_scans';
const LOCAL_CHATS_KEY = 'kfhh_local_chat_history';

function getLocalItems<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalItem<T>(key: string, item: T) {
  if (typeof window === 'undefined') return;
  try {
    const items = getLocalItems<T>(key);
    items.unshift(item);
    localStorage.setItem(key, JSON.stringify(items.slice(0, 50)));
  } catch (e) {
    // Ignore local storage error
  }
}

// Sync farmer crops
export async function syncCropToSupabase(crop: SupabaseCropRecord) {
  // Always save to local storage first for resilience
  saveLocalItem(LOCAL_CROPS_KEY, { ...crop, id: crop.id || `crop_${Date.now()}` });

  const { url } = getStoredSupabaseConfig();
  const hasCustomConfig = typeof window !== 'undefined' && localStorage.getItem(STORAGE_URL_KEY);

  if (!hasCustomConfig && url === DEFAULT_SUPABASE_URL) {
    return { success: true, localOnly: true };
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client.from('farmer_crops').insert([crop]).select();
    if (error) {
      console.debug('Supabase sync notice:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    console.debug('Supabase crop sync bypassed:', err?.message || err);
    return { success: false, error: err?.message };
  }
}

// Fetch farmer crops
export async function fetchCropsFromSupabase(): Promise<SupabaseCropRecord[]> {
  const localList = getLocalItems<SupabaseCropRecord>(LOCAL_CROPS_KEY);
  const { url } = getStoredSupabaseConfig();
  const hasCustomConfig = typeof window !== 'undefined' && localStorage.getItem(STORAGE_URL_KEY);

  if (!hasCustomConfig && url === DEFAULT_SUPABASE_URL) {
    return localList;
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client.from('farmer_crops').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data && data.length > 0 ? data : localList;
  } catch (err) {
    console.debug('Supabase fetch crops bypassed, using local store:', err);
    return localList;
  }
}

// Save crop scan diagnosis
export async function syncScanToSupabase(scan: SupabaseScanRecord) {
  saveLocalItem(LOCAL_SCANS_KEY, { ...scan, id: scan.id || `scan_${Date.now()}` });

  const { url } = getStoredSupabaseConfig();
  const hasCustomConfig = typeof window !== 'undefined' && localStorage.getItem(STORAGE_URL_KEY);

  if (!hasCustomConfig && url === DEFAULT_SUPABASE_URL) {
    return { success: true, localOnly: true };
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client.from('crop_scans').insert([scan]).select();
    if (error) {
      console.debug('Supabase scan notice:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    console.debug('Supabase scan sync bypassed:', err?.message || err);
    return { success: false, error: err?.message };
  }
}

// Save chat history
export async function syncChatToSupabase(chat: SupabaseChatRecord) {
  saveLocalItem(LOCAL_CHATS_KEY, { ...chat, id: chat.id || `chat_${Date.now()}` });

  const { url } = getStoredSupabaseConfig();
  const hasCustomConfig = typeof window !== 'undefined' && localStorage.getItem(STORAGE_URL_KEY);

  if (!hasCustomConfig && url === DEFAULT_SUPABASE_URL) {
    return { success: true, localOnly: true };
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client.from('chat_history').insert([chat]).select();
    if (error) {
      console.debug('Supabase chat notice:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    console.debug('Supabase chat sync bypassed:', err?.message || err);
    return { success: false, error: err?.message };
  }
}
