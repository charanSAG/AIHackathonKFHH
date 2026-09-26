import React from 'react';
import { TabType } from '../types';

interface HomeScreenProps {
  onNavigateTab: (tab: TabType) => void;
  onOpenVoiceModal: () => void;
  onOpenScanModal: () => void;
  farmerName?: string;
  location?: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateTab,
  onOpenVoiceModal,
  onOpenScanModal,
  farmerName,
  location,
}) => {
  return (
    <div className="pb-24 px-4 pt-3 space-y-4 max-w-lg mx-auto bg-surface-canvas text-on-surface">
      {/* Farmer Profile & Weather Bar */}
      <section className="bg-surface-card rounded-2xl border border-outline-variant/50 p-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary bg-emerald-100 flex items-center justify-center text-primary font-bold text-lg">
              <span className="material-symbols-outlined text-2xl" data-icon="person">
                person
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-on-surface">
                  {farmerName ? `Namaste, ${farmerName}` : 'Welcome, Farmer'}
                </h2>
                <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary text-[10px] font-bold">
                  Verified Farmer
                </span>
              </div>
              <p className="text-xs text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-primary" data-icon="location_on">
                  location_on
                </span>
                {location || 'Registered Farm'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-base font-bold text-primary">31°C</span>
            <p className="text-[10px] text-on-surface-variant font-medium">Partly Cloudy</p>
          </div>
        </div>

        {/* Hero Artwork - Image 7 representation */}
        <div className="relative mt-3 h-44 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 border border-primary/20">
          <img
            src="https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80"
            alt="Indian farmer in vibrant green crops field under warm sun"
            className="w-full h-full object-cover mix-blend-overlay opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-3.5 flex flex-col justify-end text-white">
            <span className="px-2 py-0.5 rounded-full bg-accent-mint/20 text-accent-mint text-[10px] font-bold w-fit mb-1 border border-accent-mint/30">
              Farm Stewardship · Season Kharif
            </span>
            <h3 className="text-sm font-bold leading-snug">
              Smart Foliage Protection &amp; Mandi Intelligence
            </h3>
            <p className="text-[11px] text-slate-200 mt-0.5">
              Protect tomato and chilli plots before pre-monsoon showers.
            </p>
          </div>
        </div>

        {/* Spray Window Banner */}
        <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-status-warning text-lg" data-icon="wb_sunny">
              wb_sunny
            </span>
            <div>
              <strong className="text-amber-950 font-bold">Today's Spray Window:</strong>
              <p className="text-[11px] text-amber-900">Optimal 6:00 AM - 9:30 AM. 45% rain chance after 4 PM.</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 text-[10px] font-bold shrink-0">
            Favorable AM
          </span>
        </div>
      </section>

      {/* Quick Launch Buttons Grid */}
      <section className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => onNavigateTab('doctor')}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-primary/30 flex flex-col items-start gap-2 shadow-sm text-left hover:border-primary active:scale-95 transition-transform"
          type="button"
        >
          <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-xl" data-icon="document_scanner">
              document_scanner
            </span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-on-surface">AI Crop Doctor</h4>
            <p className="text-[10px] text-on-surface-variant mt-0.5">Scan leaf spots &amp; get instant cure</p>
          </div>
          <span className="text-[10px] font-bold text-primary flex items-center gap-0.5 mt-auto">
            Open Scanner →
          </span>
        </button>

        <button
          onClick={onOpenVoiceModal}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-300/50 flex flex-col items-start gap-2 shadow-sm text-left hover:border-amber-400 active:scale-95 transition-transform"
          type="button"
        >
          <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-xl" data-icon="mic">
              mic
            </span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-on-surface">Voice Assistant</h4>
            <p className="text-[10px] text-on-surface-variant mt-0.5">Ask in Telugu, Hindi or English</p>
          </div>
          <span className="text-[10px] font-bold text-amber-700 flex items-center gap-0.5 mt-auto">
            Tap to Speak →
          </span>
        </button>

        <button
          onClick={() => onNavigateTab('mandi')}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-200 flex flex-col items-start gap-2 shadow-sm text-left hover:border-blue-400 active:scale-95 transition-transform"
          type="button"
        >
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-xl" data-icon="storefront">
              storefront
            </span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-on-surface">Mandi Live Rates</h4>
            <p className="text-[10px] text-on-surface-variant mt-0.5">Warangal, Nizamabad &amp; Guntur</p>
          </div>
          <span className="text-[10px] font-bold text-blue-700 flex items-center gap-0.5 mt-auto">
            View Rates →
          </span>
        </button>

        <button
          onClick={() => onNavigateTab('crops')}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-200 flex flex-col items-start gap-2 shadow-sm text-left hover:border-purple-400 active:scale-95 transition-transform"
          type="button"
        >
          <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-xl" data-icon="psychiatry">
              psychiatry
            </span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-on-surface">My 4 Crop Plots</h4>
            <p className="text-[10px] text-on-surface-variant mt-0.5">Tomato, Chilli, Paddy, Cotton</p>
          </div>
          <span className="text-[10px] font-bold text-purple-700 flex items-center gap-0.5 mt-auto">
            Manage Plots →
          </span>
        </button>
      </section>

      {/* Field Health Alert Card */}
      <section className="bg-surface-card rounded-2xl border border-outline-variant/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl" data-icon="shield">
              shield
            </span>
            <h3 className="text-sm font-bold text-on-surface">Plot Health Overview</h3>
          </div>
          <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
            1 Plot Needs Spray
          </span>
        </div>

        <div className="space-y-2">
          <div
            onClick={() => onNavigateTab('doctor')}
            className="p-2.5 rounded-xl bg-surface-canvas border border-outline-variant/40 flex items-center justify-between cursor-pointer hover:border-primary transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-status-warning" />
              <div>
                <p className="text-xs font-bold text-on-surface">Tomato (Plot A - 2.5 Ac)</p>
                <p className="text-[10px] text-on-surface-variant">Early Blight detected (Moderate)</p>
              </div>
            </div>
            <span className="text-xs font-bold text-status-critical">Action Due →</span>
          </div>

          <div
            onClick={() => onNavigateTab('doctor')}
            className="p-2.5 rounded-xl bg-surface-canvas border border-outline-variant/40 flex items-center justify-between cursor-pointer hover:border-primary transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-status-healthy" />
              <div>
                <p className="text-xs font-bold text-on-surface">Chilli (Plot B - 1.8 Ac)</p>
                <p className="text-[10px] text-on-surface-variant">Foliage healthy • Vegetative Stage</p>
              </div>
            </div>
            <span className="text-xs font-bold text-status-healthy">92% Healthy</span>
          </div>
        </div>
      </section>
    </div>
  );
};
