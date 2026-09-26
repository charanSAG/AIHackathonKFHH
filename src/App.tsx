/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Language, getT } from './data/kfhhData';
import { KfhhNavbar } from './components/KfhhNavbar';
import { KfhhMainView } from './components/KfhhMainView';
import { KfhhAiChatDrawer } from './components/KfhhAiChatDrawer';
import { SupabaseSyncModal } from './components/SupabaseSyncModal';
import { FarmerAuthModal } from './components/FarmerAuthModal';
import {
  FarmerProfile,
  FarmDetails,
  FarmerCrop,
  getCurrentFarmerProfile,
  getCurrentFarmerFarm,
  getCurrentFarmerCrops,
  logoutFarmer,
} from './services/farmerService';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'register' | 'login'>('register');

  // Real Farmer State from Supabase
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile | null>(null);
  const [farmDetails, setFarmDetails] = useState<FarmDetails | null>(null);
  const [cropsList, setCropsList] = useState<FarmerCrop[]>([]);
  const [isFarmerLoading, setIsFarmerLoading] = useState(true);

  const t = getT(lang);

  const refreshFarmerData = async () => {
    setIsFarmerLoading(true);
    try {
      const profile = await getCurrentFarmerProfile();
      setFarmerProfile(profile);
      if (profile) {
        if (profile.preferred_language && ['en', 'te', 'hi'].includes(profile.preferred_language)) {
          setLang(profile.preferred_language as Language);
        }
        const [farm, crops] = await Promise.all([
          getCurrentFarmerFarm(profile.id),
          getCurrentFarmerCrops(profile.id),
        ]);
        setFarmDetails(farm);
        setCropsList(crops);
      } else {
        setFarmDetails(null);
        setCropsList([]);
      }
    } catch (err) {
      console.warn('Error loading farmer data from Supabase:', err);
      setFarmerProfile(null);
      setFarmDetails(null);
      setCropsList([]);
    } finally {
      setIsFarmerLoading(false);
    }
  };

  useEffect(() => {
    refreshFarmerData();
  }, []);

  const handleLogout = async () => {
    await logoutFarmer();
    setFarmerProfile(null);
    setFarmDetails(null);
    setCropsList([]);
  };

  const handleOpenAuth = (mode: 'register' | 'login' = 'register') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = async (profile: FarmerProfile) => {
    setFarmerProfile(profile);
    if (profile.preferred_language && ['en', 'te', 'hi'].includes(profile.preferred_language)) {
      setLang(profile.preferred_language as Language);
    }
    await refreshFarmerData();
  };

  const handleNavigate = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* 1. Sticky Navigation Header */}
      <KfhhNavbar
        lang={lang}
        setLang={setLang}
        onNavigate={handleNavigate}
        onOpenSupabase={() => setIsSupabaseModalOpen(true)}
        farmerProfile={farmerProfile}
        onOpenAuth={() => handleOpenAuth('register')}
        onLogout={handleLogout}
      />

      {/* 2. Main Page Content */}
      <main>
        <KfhhMainView
          lang={lang}
          onOpenAiChat={() => setIsAiChatOpen(true)}
          onOpenSupabase={() => setIsSupabaseModalOpen(true)}
          farmerProfile={farmerProfile}
          farmDetails={farmDetails}
          cropsList={cropsList}
          isFarmerLoading={isFarmerLoading}
          onRefreshFarmer={refreshFarmerData}
          onOpenAuth={handleOpenAuth}
          onLogout={handleLogout}
        />
      </main>

      {/* 3. Floating "Ask Farmer AI" CTA Button */}
      <button
        onClick={() => setIsAiChatOpen(true)}
        className="fixed bottom-5 right-5 z-40 h-14 rounded-full bg-primary hover:bg-primary/90 px-6 text-base font-bold text-primary-foreground shadow-lg flex items-center gap-2 active:scale-95 transition-transform"
        type="button"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
        <span>{t('askAi')}</span>
      </button>

      {/* 4. Farmer AI Slide-Over Chat Drawer */}
      <KfhhAiChatDrawer
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        lang={lang}
      />

      {/* 5. Supabase Database Sync Modal */}
      <SupabaseSyncModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      {/* 6. Farmer Registration & Login Modal */}
      <FarmerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        lang={lang}
        initialMode={authModalMode}
      />
    </div>
  );
}
