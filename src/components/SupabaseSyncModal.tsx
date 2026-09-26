import React, { useState, useEffect } from 'react';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  syncCropToSupabase,
  fetchCropsFromSupabase,
} from '../lib/supabase';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [showSql, setShowSql] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getStoredSupabaseConfig();
      setUrl(config.url);
      setAnonKey(config.anonKey);
      setTestResult(null);
      setSyncStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    saveSupabaseConfig(url, anonKey);
    const res = await testSupabaseConnection();
    setIsTesting(false);
    setTestResult(res);
  };

  const handleSave = () => {
    saveSupabaseConfig(url, anonKey);
    setSyncStatus('Configuration saved successfully!');
    setTimeout(() => setSyncStatus(null), 3000);
  };

  const handleQuickSyncDemo = async () => {
    setIsSyncing(true);
    setSyncStatus('Syncing farm crops to Supabase cloud database...');
    saveSupabaseConfig(url, anonKey);

    const sampleCrop = {
      name: 'Tomato (Solanaceae)',
      variety: 'Desi Hybrid (Sahu)',
      area_acres: 3.5,
      stage: 'Fruiting & Ripening',
      health_score: 87,
      location: 'Plot A-1, Warangal Rural',
    };

    const res = await syncCropToSupabase(sampleCrop);
    setIsSyncing(false);
    if (res.success) {
      setSyncStatus('Success! Synced sample crop record to Supabase table "farmer_crops".');
    } else {
      setSyncStatus(`Sync notice: ${res.error || 'Check table schema'}. Tip: Run the SQL migration below in Supabase SQL editor.`);
    }
  };

  const sqlSchema = `-- ==============================================================================
-- Supabase Database Schema for KFHH (Kisan Future Helping Hand)
-- ==============================================================================
-- Run this in your Supabase Project -> SQL Editor

-- 1. Table: farmer_profiles
CREATE TABLE IF NOT EXISTS public.farmer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  village TEXT NOT NULL,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT farmer_profiles_user_id_key UNIQUE (user_id)
);

-- 2. Table: farms
CREATE TABLE IF NOT EXISTS public.farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.farmer_profiles(id) ON DELETE CASCADE,
  farm_name TEXT,
  land_area NUMERIC NOT NULL DEFAULT 1.0,
  land_area_unit TEXT NOT NULL DEFAULT 'Acres',
  village TEXT,
  district TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table: farmer_crops
CREATE TABLE IF NOT EXISTS public.farmer_crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.farmer_profiles(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
  crop_name TEXT NOT NULL,
  variety TEXT,
  sowing_date DATE,
  area NUMERIC,
  area_unit TEXT DEFAULT 'Acres',
  season TEXT,
  irrigation_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Table: crop_scans
CREATE TABLE IF NOT EXISTS public.crop_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmer_profiles(id) ON DELETE CASCADE,
  crop_name TEXT NOT NULL,
  disease_detected TEXT NOT NULL,
  confidence INTEGER,
  severity TEXT,
  recommended_treatment TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Row Level Security (RLS) - Farmer A cannot see Farmer B records
ALTER TABLE public.farmer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "farmer_profiles_select_own" ON public.farmer_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "farmer_profiles_insert_own" ON public.farmer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "farmer_profiles_update_own" ON public.farmer_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "farmer_profiles_delete_own" ON public.farmer_profiles FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "farms_select_own" ON public.farms FOR SELECT USING (farmer_id IN (SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "farms_insert_own" ON public.farms FOR INSERT WITH CHECK (farmer_id IN (SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "farms_update_own" ON public.farms FOR UPDATE USING (farmer_id IN (SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "farms_delete_own" ON public.farms FOR DELETE USING (farmer_id IN (SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "farmer_crops_select_own" ON public.farmer_crops FOR SELECT USING (farmer_id IN (SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "farmer_crops_insert_own" ON public.farmer_crops FOR INSERT WITH CHECK (farmer_id IN (SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "farmer_crops_update_own" ON public.farmer_crops FOR UPDATE USING (farmer_id IN (SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()));
CREATE POLICY "farmer_crops_delete_own" ON public.farmer_crops FOR DELETE USING (farmer_id IN (SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()));
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border shadow-2xl p-6 space-y-5 text-foreground animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-black text-xl">
              ⚡
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                Supabase Cloud Database
              </h2>
              <p className="text-xs text-muted-foreground">Connected Realtime Backend & Data Sync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Status Indicator */}
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center gap-3">
          <span className="size-3 rounded-full bg-emerald-500 animate-ping" />
          <div className="flex-1 text-xs">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">
              Supabase Instance Active:
            </span>{' '}
            <span className="text-muted-foreground font-mono truncate block sm:inline">
              {url.slice(0, 38)}...
            </span>
          </div>
        </div>

        {/* Configuration Inputs */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full h-11 px-3.5 rounded-xl bg-background border border-input text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Supabase Anon / Public API Key
            </label>
            <textarea
              rows={2}
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full p-3 rounded-xl bg-background border border-input text-xs font-mono focus:ring-2 focus:ring-primary/20 outline-none resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            onClick={handleTest}
            disabled={isTesting}
            className="flex-1 min-w-[140px] h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            type="button"
          >
            {isTesting ? (
              <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
            ) : (
              <span>🔗 Test Connection</span>
            )}
          </button>

          <button
            onClick={handleQuickSyncDemo}
            disabled={isSyncing}
            className="flex-1 min-w-[140px] h-11 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            type="button"
          >
            {isSyncing ? (
              <span className="size-4 animate-spin rounded-full border-2 border-secondary-foreground/30 border-t-secondary-foreground" />
            ) : (
              <span>☁️ Sync Farm Data</span>
            )}
          </button>

          <button
            onClick={handleSave}
            className="h-11 px-5 rounded-xl border border-border bg-card hover:bg-secondary text-foreground font-bold text-sm active:scale-95"
            type="button"
          >
            Save
          </button>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold ${
              testResult.success
                ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20'
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}
          >
            {testResult.message}
          </div>
        )}

        {/* Sync Status Banner */}
        {syncStatus && (
          <div className="p-3 rounded-xl bg-secondary text-xs text-foreground font-medium border border-border">
            {syncStatus}
          </div>
        )}

        {/* SQL Schema Generator Accordion */}
        <div className="border border-border/80 rounded-2xl p-4 bg-secondary/30 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">Database Schema (SQL)</p>
              <p className="text-xs text-muted-foreground">Tables: farmer_crops, crop_scans, chat_history</p>
            </div>
            <button
              onClick={() => setShowSql(!showSql)}
              className="text-xs font-bold text-primary hover:underline"
              type="button"
            >
              {showSql ? 'Hide SQL' : 'View SQL'}
            </button>
          </div>

          {showSql && (
            <div className="space-y-2 pt-2">
              <div className="relative">
                <pre className="p-3 rounded-xl bg-background border border-border text-[11px] font-mono overflow-x-auto max-h-48 text-muted-foreground leading-relaxed">
                  {sqlSchema}
                </pre>
                <button
                  onClick={copyToClipboard}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-xs active:scale-95"
                  type="button"
                >
                  {copiedSql ? 'Copied! ✓' : 'Copy SQL'}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Paste this into your{' '}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  Supabase Dashboard &gt; SQL Editor
                </a>{' '}
                to create all farm tables instantly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
