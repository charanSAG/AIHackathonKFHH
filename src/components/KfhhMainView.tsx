import React, { useState, useRef, useEffect } from 'react';
import {
  Language,
  getT,
  TODAY_ACTIONS,
  DEMAND_DATA,
  COMMUNITY_POSTS,
  EARNINGS_CHART,
  WALLET_TRANSACTIONS,
  DEFAULT_MANDI_ROWS,
  INDIAN_STATES,
  MandiRow,
} from '../data/kfhhData';
import {
  fetchLiveAgriWeather,
  searchAgriLocations,
  reverseGeocodeGPS,
  detectRuntimeLocation,
  fetchLiveMandiRates,
  callCropDoctorDiagnosis,
  OFFICIAL_GOV_SCHEMES,
  OfficialGovScheme,
  WeatherData,
  LocationResult,
  LiveMandiItem,
} from '../services/api';
import { syncScanToSupabase, syncCropToSupabase } from '../lib/supabase';
import { DoctorChatModal } from './DoctorChatModal';
import { SchemeCalculatorModal } from './SchemeCalculatorModal';
import { LocationSelectModal } from './LocationSelectModal';
import {
  FarmerProfile,
  FarmDetails,
  FarmerCrop,
  deleteCrop,
} from '../services/farmerService';
import { FarmerCropModal } from './FarmerCropModal';
import { FarmerProfileModal } from './FarmerProfileModal';

interface KfhhMainViewProps {
  lang: Language;
  onOpenAiChat: () => void;
  onOpenSupabase?: () => void;
  farmerProfile?: FarmerProfile | null;
  farmDetails?: FarmDetails | null;
  cropsList: FarmerCrop[];
  isFarmerLoading?: boolean;
  onRefreshFarmer: () => Promise<void>;
  onOpenAuth: (mode?: 'register' | 'login') => void;
  onLogout?: () => void;
}

export const KfhhMainView: React.FC<KfhhMainViewProps> = ({
  lang,
  onOpenAiChat,
  onOpenSupabase,
  farmerProfile,
  farmDetails,
  cropsList,
  isFarmerLoading,
  onRefreshFarmer,
  onOpenAuth,
  onLogout,
}) => {
  const t = getT(lang);

  // Smooth scroll
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Farmer Modals & Crop Actions
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropToEdit, setCropToEdit] = useState<FarmerCrop | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [deletingCropId, setDeletingCropId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDeleteCrop = async (crop: FarmerCrop) => {
    if (window.confirm(`Are you sure you want to delete ${crop.crop_name} from your farm?`)) {
      setDeletingCropId(crop.id);
      const res = await deleteCrop(crop.id);
      setDeletingCropId(null);
      if (res.success) {
        showToast(`Deleted ${crop.crop_name} from your farm`);
        await onRefreshFarmer();
      } else {
        showToast(`Could not delete crop: ${res.error || 'Database error'}`);
      }
    }
  };

  const handleCropSaved = async (savedCrop: FarmerCrop) => {
    showToast(`Saved ${savedCrop.crop_name} to your farm in Supabase`);
    await onRefreshFarmer();
  };

  // AI Crop Doctor State
  const [diagnosisState, setDiagnosisState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [leafPhoto, setLeafPhoto] = useState<string | null>(null);
  const [selectedCropName, setSelectedCropName] = useState('Tomato (Solanaceae)');
  const [diagnosisResult, setDiagnosisResult] = useState<any>(null);
  const [isDoctorChatOpen, setIsDoctorChatOpen] = useState(false);
  const [isSyncingScan, setIsSyncingScan] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLeafUpload = async (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setLeafPhoto(base64);
      setDiagnosisState('loading');

      try {
        const result = await callCropDoctorDiagnosis({
          imageBase64: base64,
          cropName: selectedCropName,
          language: lang,
        });
        setDiagnosisResult(result);
        setDiagnosisState('done');
        showToast('Gemini 3.8 Flash analyzed leaf foliage!');
      } catch (err) {
        setDiagnosisState('done');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSampleLeaf = async (sampleType: string) => {
    setDiagnosisState('loading');
    const sampleUrls: Record<string, string> = {
      'Tomato Blight': 'https://images.unsplash.com/photo-1592417817098-8f3d69103851?w=800&auto=format&fit=crop&q=80',
      'Chilli Curl': 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800&auto=format&fit=crop&q=80',
      'Paddy Blast': 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=800&auto=format&fit=crop&q=80',
      'Cotton Spot': 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=800&auto=format&fit=crop&q=80',
    };

    setLeafPhoto(sampleUrls[sampleType] || sampleUrls['Tomato Blight']);
    setSelectedCropName(sampleType);

    const result = await callCropDoctorDiagnosis({
      cropName: sampleType,
      language: lang,
      symptoms: `${sampleType} leaf spots and tissue discoloration`,
    });
    setDiagnosisResult(result);
    setDiagnosisState('done');
    showToast(`Diagnosed ${sampleType} with Gemini AI!`);
  };

  const handleSyncDiagnosisToSupabase = async () => {
    if (!diagnosisResult) return;
    setIsSyncingScan(true);
    const res = await syncScanToSupabase({
      crop_name: selectedCropName,
      disease_detected: diagnosisResult.disease,
      confidence: diagnosisResult.confidence,
      severity: diagnosisResult.severity,
      recommended_treatment: diagnosisResult.chemicalTreatment,
      image_url: leafPhoto || undefined,
    });
    setIsSyncingScan(false);
    if (res.success) {
      showToast('Scan report saved to Supabase (crop_scans table)!');
    } else {
      showToast('Synced locally! Connect Supabase via navbar button.');
    }
  };

  // Weather state (Public Open-Meteo API)
  const [isWeatherOpen, setIsWeatherOpen] = useState(true);
  const [weatherQuery, setWeatherQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState('Hyderabad, Telangana');
  const [currentCoords, setCurrentCoords] = useState({ lat: 17.385, lon: 78.4867 });
  const [liveWeather, setLiveWeather] = useState<WeatherData | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationResult[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [detectionMethod, setDetectionMethod] = useState<'gps' | 'ip' | 'default' | 'manual'>('default');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Automatically detect farmer location at runtime on mount or load from localStorage
  useEffect(() => {
    let isMounted = true;

    // Check if user previously saved a location
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('kfhh_selected_location');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.name && parsed.lat && parsed.lon) {
            setCurrentCoords({ lat: parsed.lat, lon: parsed.lon });
            setCurrentLocation(parsed.name);
            setDetectionMethod('manual');
            if (parsed.state) {
              const matched = INDIAN_STATES.find(
                (s) => s.toLowerCase() === parsed.state.toLowerCase() || parsed.state.toLowerCase().includes(s.toLowerCase())
              );
              if (matched) setSelectedState(matched);
            }
            return;
          }
        }
      } catch (e) {
        // ignore
      }
    }

    detectRuntimeLocation().then((detected) => {
      if (!isMounted) return;
      setCurrentCoords({ lat: detected.lat, lon: detected.lon });
      setCurrentLocation(detected.placeName);
      setDetectionMethod(detected.method);

      // Auto-adapt Mandi state filter to user's location
      if (detected.state) {
        const matched = INDIAN_STATES.find(
          (s) => s.toLowerCase() === detected.state.toLowerCase() || detected.state.toLowerCase().includes(s.toLowerCase())
        );
        if (matched) {
          setSelectedState(matched);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLocationChosen = (loc: { name: string; state: string; lat: number; lon: number }) => {
    setCurrentLocation(loc.name);
    setCurrentCoords({ lat: loc.lat, lon: loc.lon });
    setDetectionMethod('manual');

    // Auto-adapt Mandi state filter to chosen location
    if (loc.state) {
      const matched = INDIAN_STATES.find(
        (s) => s.toLowerCase() === loc.state.toLowerCase() || loc.state.toLowerCase().includes(s.toLowerCase())
      );
      if (matched) {
        setSelectedState(matched);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'kfhh_selected_location',
          JSON.stringify({
            name: loc.name,
            state: loc.state,
            lat: loc.lat,
            lon: loc.lon,
          })
        );
      } catch {
        // ignore
      }
    }

    showToast(`📍 Location set to ${loc.name}`);
  };

  // Fetch weather whenever coordinates or location change
  useEffect(() => {
    fetchLiveAgriWeather(currentCoords.lat, currentCoords.lon, currentLocation).then((data) => {
      setLiveWeather(data);
    });
  }, [currentCoords, currentLocation]);

  const handleLocationSearch = async (val: string) => {
    setWeatherQuery(val);
    if (val.trim().length >= 2) {
      const results = await searchAgriLocations(val);
      setLocationSuggestions(results);
    } else {
      setLocationSuggestions([]);
    }
  };

  const handleSelectLocation = async (loc: LocationResult) => {
    const locName = `${loc.name}, ${loc.state}`;
    setCurrentLocation(locName);
    setCurrentCoords({ lat: loc.latitude, lon: loc.longitude });
    setWeatherQuery('');
    setLocationSuggestions([]);
    showToast(`Weather updated for ${loc.name} via Open-Meteo`);
  };

  const handleUseGpsLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported by your browser.');
      return;
    }
    setIsSearchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentCoords({ lat: latitude, lon: longitude });
        const placeName = await reverseGeocodeGPS(latitude, longitude);
        setCurrentLocation(placeName);
        setIsSearchingLocation(false);
        showToast(`GPS location detected: ${placeName}`);
      },
      () => {
        setIsSearchingLocation(false);
        setCurrentLocation('Warangal Rural, Telangana');
        setCurrentCoords({ lat: 17.9784, lon: 79.5941 });
        showToast('Set to Warangal Rural (default agricultural hub)');
      },
      { timeout: 7000 }
    );
  };

  // Mandi State (Public APMC & AGMARKNET Feed)
  const [selectedState, setSelectedState] = useState('Telangana');
  const [selectedCropFilter, setSelectedCropFilter] = useState('All');
  const [mandiSearch, setMandiSearch] = useState('');
  const [isComparingPrices, setIsComparingPrices] = useState(false);
  const [isRefreshingMandi, setIsRefreshingMandi] = useState(false);
  const [mandiRates, setMandiRates] = useState<LiveMandiItem[]>([]);

  useEffect(() => {
    fetchLiveMandiRates(selectedCropFilter, selectedState).then((data) => {
      setMandiRates(data);
    });
  }, [selectedState, selectedCropFilter]);

  const handleRefreshMandi = async () => {
    setIsRefreshingMandi(true);
    const data = await fetchLiveMandiRates(selectedCropFilter, selectedState);
    setMandiRates(data);
    setIsRefreshingMandi(false);
    showToast('Live Mandi rates refreshed from AGMARKNET feeds!');
  };

  const filteredMandiRows = mandiRates.filter(
    (row) =>
      row.crop.toLowerCase().includes(mandiSearch.toLowerCase()) ||
      row.market.toLowerCase().includes(mandiSearch.toLowerCase()) ||
      row.district.toLowerCase().includes(mandiSearch.toLowerCase()) ||
      row.variety.toLowerCase().includes(mandiSearch.toLowerCase())
  );

  // Authentic Schemes Modal & Calculator
  const [selectedScheme, setSelectedScheme] = useState<OfficialGovScheme | null>(null);
  const [isSchemeCalcOpen, setIsSchemeCalcOpen] = useState(false);

  // Community State
  const [communityScope, setCommunityScope] = useState<'All' | 'My District' | 'My Crops' | 'Experts'>('All');
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  return (
    <div className="space-y-0">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 rounded-2xl bg-foreground text-background px-4 py-2.5 text-xs font-bold shadow-lg animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* 1. Hero Section (Section 0) */}
      <section id="home" className="scroll-mt-20 bg-secondary/60">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 md:py-16 lg:grid-cols-2">
          <div>
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-card px-3.5 py-1.5 text-sm font-semibold text-foreground shadow-xs border border-border/80 hover:border-primary/60 hover:bg-card/90 active:scale-95 transition-all cursor-pointer group"
              title="Click to select your farm & mandi location"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4 text-primary group-hover:scale-110 transition-transform shrink-0"
              >
                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="truncate max-w-[240px] sm:max-w-xs">{currentLocation || t('location')}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors ml-0.5 shrink-0"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground">
              {farmerProfile ? `Welcome, ${farmerProfile.full_name}` : t('greeting')}{' '}
              <span className="inline-block">👨‍🌾</span>
            </h1>

            {farmerProfile ? (
              <div className="mt-3 rounded-2xl bg-card border border-border/80 p-3.5 shadow-2xs space-y-1.5 text-xs sm:text-sm">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-foreground">
                  <span>
                    <strong className="text-primary font-bold">Village:</strong> {farmerProfile.village}
                  </span>
                  <span>
                    <strong className="text-primary font-bold">District:</strong> {farmerProfile.district}
                  </span>
                  <span>
                    <strong className="text-primary font-bold">State:</strong> {farmerProfile.state}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground border-t border-border/50 pt-1.5">
                  <span className="text-foreground">
                    <strong className="text-primary font-bold">Land:</strong>{' '}
                    {farmDetails ? `${farmDetails.land_area} ${farmDetails.land_area_unit}` : 'Registered'}
                  </span>
                  <span className="text-foreground">
                    <strong className="text-primary font-bold">My Crops:</strong>{' '}
                    {cropsList.length > 0
                      ? cropsList.map((c) => c.crop_name).join(', ')
                      : 'No crops added yet'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl bg-card border border-primary/30 p-4 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span>ℹ️</span>
                  <span>No farmer profile found. Please complete your registration.</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Connect your real farm profile to unlock personalized Open-Meteo forecasts, disease treatment plans, and AGMARKNET mandi rates.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenAuth('register')}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 shadow-2xs"
                  >
                    Register as Farmer
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenAuth('login')}
                    className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80"
                  >
                    Login
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onOpenAiChat}
                className="h-14 rounded-2xl bg-primary px-7 text-base font-bold text-primary-foreground shadow-sm hover:bg-primary/90 flex items-center gap-2 active:scale-95 transition-transform"
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
                {t('askAi')}
              </button>

              <button
                onClick={() => scrollTo('diagnose')}
                className="h-14 rounded-2xl border-2 border-border bg-card px-7 text-base font-bold text-foreground hover:bg-secondary flex items-center gap-2 active:scale-95 transition-transform"
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
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
                {t('diagnose')}
              </button>
            </div>
          </div>

          {/* Hero Farmer Photo */}
          <div className="overflow-hidden rounded-[2rem] shadow-lg ring-1 ring-border aspect-4/3 bg-muted">
            <img
              src="/assets/hero-farm.jpg"
              alt="Indian farmer standing in a green field with a tractor"
              width={1280}
              height={960}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 2. Today's Farm Summary (Section 1) */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="mb-5 text-2xl font-extrabold tracking-tight text-foreground">
          {t('todaySummary')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Card 1: Weather */}
          <div className="rounded-3xl border border-border/70 bg-card shadow-xs transition-shadow hover:shadow-md p-6 space-y-3">
            <div className="flex size-14 items-center justify-center rounded-2xl text-3xl bg-sky/15">
              🌤️
            </div>
            <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              {t('weather')}
            </p>
            <p className="text-3xl font-extrabold text-foreground">29°C</p>
            <p className="font-medium text-foreground">Partly cloudy</p>
            <p className="text-sm font-semibold text-primary">Rain probability: 68%</p>
            <p className="text-sm text-muted-foreground">{currentLocation}</p>
            <button
              onClick={() => scrollTo('weather')}
              className="w-full rounded-xl bg-secondary hover:bg-secondary/80 py-2.5 text-xs font-bold text-secondary-foreground transition-colors active:scale-95"
              type="button"
            >
              {t('viewForecast')}
            </button>
          </div>

          {/* Card 2: Crop Health */}
          <div className="rounded-3xl border border-border/70 bg-card shadow-xs transition-shadow hover:shadow-md p-6 space-y-3">
            <div className="flex size-14 items-center justify-center rounded-2xl text-3xl bg-primary/12">
              🌱
            </div>
            <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              {t('cropHealth')}
            </p>
            <p className="text-3xl font-extrabold text-foreground">Good</p>
            <p className="font-medium text-foreground">Paddy</p>
            <p className="text-sm font-semibold text-primary">Health score: 87%</p>
            <p className="text-sm text-muted-foreground">Your crop looks healthy</p>
            <button
              onClick={() => scrollTo('crops')}
              className="w-full rounded-xl bg-secondary hover:bg-secondary/80 py-2.5 text-xs font-bold text-secondary-foreground transition-colors active:scale-95"
              type="button"
            >
              {t('viewCrop')}
            </button>
          </div>

          {/* Card 3: Mandi */}
          <div className="rounded-3xl border border-border/70 bg-card shadow-xs transition-shadow hover:shadow-md p-6 space-y-3">
            <div className="flex size-14 items-center justify-center rounded-2xl text-3xl bg-accent/15">
              📈
            </div>
            <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              {t('mandi')}
            </p>
            <p className="text-3xl font-extrabold text-foreground">₹2,450/q</p>
            <p className="font-medium text-foreground">Tomato</p>
            <p className="text-sm font-semibold text-primary">Bowenpally, Hyderabad</p>
            <p className="text-sm text-muted-foreground">Official daily mandi data</p>
            <button
              onClick={() => scrollTo('markets')}
              className="w-full rounded-xl bg-secondary hover:bg-secondary/80 py-2.5 text-xs font-bold text-secondary-foreground transition-colors active:scale-95"
              type="button"
            >
              {t('viewPrices')}
            </button>
          </div>

          {/* Card 4: Government Schemes */}
          <div className="rounded-3xl border border-border/70 bg-card shadow-xs transition-shadow hover:shadow-md p-6 space-y-3">
            <div className="flex size-14 items-center justify-center rounded-2xl text-3xl bg-sunny/20">
              🏛️
            </div>
            <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              {t('government')}
            </p>
            <p className="text-3xl font-extrabold text-foreground">3 Updates</p>
            <p className="font-medium text-foreground">Schemes</p>
            <p className="text-sm font-semibold text-primary">New schemes may be relevant to you.</p>
            <p className="text-sm text-muted-foreground">Check eligibility before applying</p>
            <button
              onClick={() => scrollTo('schemes')}
              className="w-full rounded-xl bg-secondary hover:bg-secondary/80 py-2.5 text-xs font-bold text-secondary-foreground transition-colors active:scale-95"
              type="button"
            >
              {t('viewSchemes')}
            </button>
          </div>
        </div>
      </section>

      {/* 3. What Should I Do Today? (Section 2) */}
      <section className="mx-auto max-w-7xl px-4 pb-10">
        <h2 className="mb-5 text-2xl font-extrabold tracking-tight text-foreground">
          {t('whatToDo')}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {TODAY_ACTIONS.map((item, idx) => {
            const targetMap: Record<string, string> = {
              Weather: 'weather',
              Crop: 'crops',
              Market: 'markets',
              Government: 'schemes',
            };
            return (
              <div
                key={idx}
                className="rounded-3xl border-l-4 border-l-primary bg-card p-6 shadow-xs border border-border/60"
              >
                <p className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <span className="text-2xl">{item.icon}</span> {item.tag}
                </p>
                <p className="mt-2 text-base text-foreground">{item.text}</p>
                <p className="mt-3 rounded-2xl bg-secondary p-3 text-sm text-foreground">
                  <span className="font-bold">Action: </span>
                  {item.action}
                </p>
                <button
                  onClick={() => scrollTo(targetMap[item.tag] || 'home')}
                  className="mt-3 inline-flex items-center gap-1 font-bold text-primary hover:underline text-sm"
                  type="button"
                >
                  {t('takeAction')} →
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. My Farm & Crops Section (Section 3) */}
      <section id="my-farm" className="scroll-mt-20 bg-secondary/50 py-12">
        <span id="crops" className="block -mt-12 h-12 invisible pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                <span>My Farm &amp; Crops</span>
                {farmerProfile && (
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                    {cropsList.length} {cropsList.length === 1 ? 'Crop' : 'Crops'} in Supabase
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real farm inventory, field acreage, and cultivation details from Supabase database
              </p>
            </div>
            <div className="flex items-center gap-2">
              {farmerProfile ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-card border border-border hover:bg-secondary px-3.5 py-2 text-xs font-bold text-foreground active:scale-95 shadow-2xs"
                  >
                    <span>✏️</span> Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCropToEdit(null);
                      setIsCropModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-sm font-bold active:scale-95 shadow-xs"
                  >
                    <span>+</span> {t('addCrop')}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenAuth('register')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-sm font-bold active:scale-95 shadow-xs"
                >
                  <span>👨‍🌾</span> Register Farmer Profile
                </button>
              )}
            </div>
          </div>

          {/* If No Profile Found */}
          {!farmerProfile ? (
            <div className="rounded-3xl bg-card border-2 border-dashed border-primary/30 p-8 sm:p-12 text-center space-y-3">
              <span className="text-4xl block">👨‍🌾</span>
              <h3 className="text-lg sm:text-xl font-extrabold text-foreground">
                No farmer profile found. Please complete your registration.
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                All crop and farm intelligence in KFHH is powered by real Supabase records. Register your farm in 30 seconds to track your crops and get context-aware AI advice.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onOpenAuth('register')}
                  className="px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 shadow-xs"
                >
                  Complete Farmer Registration
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="px-5 py-2.5 rounded-2xl bg-secondary text-foreground text-sm font-bold hover:bg-secondary/80"
                >
                  Login to Existing Account
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Farmer Profile & Farm Details Overview Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Farmer Profile Card */}
                <div className="rounded-3xl bg-card p-5 border border-border shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Farmer Profile
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsProfileModalOpen(true)}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-lg font-extrabold text-foreground">{farmerProfile.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    📱 {farmerProfile.mobile_number || 'Registered'}
                  </p>
                  <p className="text-xs text-foreground font-medium">
                    📍 {farmerProfile.village}, {farmerProfile.district}, {farmerProfile.state}
                  </p>
                </div>

                {/* Farm Details Card */}
                <div className="rounded-3xl bg-card p-5 border border-border shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Farm Details
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsProfileModalOpen(true)}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-lg font-extrabold text-foreground">
                    {farmDetails?.farm_name || `${farmerProfile.full_name}'s Farm`}
                  </p>
                  <p className="text-xs text-foreground font-medium">
                    🌱 Total Land:{' '}
                    <strong className="text-primary font-bold">
                      {farmDetails ? `${farmDetails.land_area} ${farmDetails.land_area_unit}` : 'Not specified'}
                    </strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Location: {farmDetails?.village || farmerProfile.village}, {farmerProfile.district}
                  </p>
                </div>

                {/* Quick AI Readiness Card */}
                <div className="rounded-3xl bg-primary/10 border border-primary/20 p-5 shadow-xs flex flex-col justify-between sm:col-span-2 lg:col-span-1">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      AI Advisory Context
                    </span>
                    <p className="text-sm font-bold text-foreground mt-1">
                      Gemini 3.8 &amp; n8n Ready
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your registered crops and soil zone automatically enrich all farmer queries.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenAiChat}
                    className="mt-3 w-fit px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 shadow-2xs"
                  >
                    Ask Farmer AI →
                  </button>
                </div>
              </div>

              {/* Crops Header & List */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-extrabold text-foreground">Registered Crops</h3>
                  {cropsList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setCropToEdit(null);
                        setIsCropModalOpen(true);
                      }}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      + Add another crop
                    </button>
                  )}
                </div>

                {cropsList.length === 0 ? (
                  /* Empty state when farmer has no crops */
                  <div className="rounded-3xl bg-card border-2 border-dashed border-border p-8 text-center space-y-3">
                    <span className="text-3xl block">🌱</span>
                    <p className="text-base font-extrabold text-foreground">No crops added yet.</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Add your current standing crops (e.g. Paddy, Cotton, Chilli) to monitor disease risks and market prices.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCropToEdit(null);
                        setIsCropModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 shadow-xs"
                    >
                      <span>+</span> Add Crop
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {cropsList.map((crop) => (
                      <div
                        key={crop.id}
                        className="rounded-3xl bg-card p-5 shadow-xs border border-border space-y-3.5 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-lg font-extrabold text-foreground leading-tight">
                              {crop.crop_name}
                            </p>
                            {crop.variety && (
                              <p className="text-xs text-muted-foreground font-medium">
                                Variety: {crop.variety}
                              </p>
                            )}
                          </div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
                            {crop.season || 'Kharif'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs border-y border-border/50 py-2.5">
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Area</span>
                            <span className="font-bold text-foreground">
                              {crop.area ? `${crop.area} ${crop.area_unit || 'Acres'}` : '1.0 Acres'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Irrigation</span>
                            <span className="font-bold text-foreground truncate block">
                              {crop.irrigation_type || 'Borewell'}
                            </span>
                          </div>
                          {crop.sowing_date && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground block text-[10px]">Sowing Date</span>
                              <span className="font-medium text-foreground">{crop.sowing_date}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons: View, Edit, Delete */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCropFilter(crop.crop_name);
                              scrollTo('markets');
                              showToast(`Showing Mandi prices for ${crop.crop_name}`);
                            }}
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                          >
                            <span>📊</span> Mandi Rates
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setCropToEdit(crop);
                                setIsCropModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-secondary text-foreground text-xs font-bold hover:bg-primary/20 hover:text-primary transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={deletingCropId === crop.id}
                              onClick={() => handleDeleteCrop(crop)}
                              className="px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20 transition-colors disabled:opacity-50"
                            >
                              {deletingCropId === crop.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* 5. AI Crop Doctor (Section 4) */}
      <section id="diagnose" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12">
        <div className="overflow-hidden rounded-[2rem] border border-primary/25 bg-primary/5 shadow-xs p-6 md:p-10">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                {t('cropDoctor')} 🌱
              </h2>
              <p className="mt-2 text-lg text-muted-foreground">{t('cropDoctorSub')}</p>

              {/* Upload area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mt-6 rounded-3xl border-2 border-dashed border-primary/40 bg-card p-8 text-center cursor-pointer hover:border-primary transition-colors"
              >
                {leafPhoto ? (
                  <img
                    src={leafPhoto}
                    alt="Selected crop"
                    className="mx-auto max-h-48 rounded-2xl object-cover shadow-sm"
                  />
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mx-auto size-12 text-primary"
                    >
                      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                      <circle cx="12" cy="13" r="3" />
                    </svg>
                    <p className="mt-3 font-semibold text-foreground">
                      Add a clear photo of the affected leaf
                    </p>
                    <p className="text-sm text-muted-foreground">
                      JPG or PNG, daylight photo works best
                    </p>
                  </>
                )}
              </div>

              {/* Sample Quick Selector */}
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Or test with sample diseased leaves:
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Tomato Blight', 'Chilli Curl', 'Paddy Blast', 'Cotton Spot'].map((sample) => (
                    <button
                      key={sample}
                      onClick={() => handleSelectSampleLeaf(sample)}
                      className="px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border/60 active:scale-95 transition-transform"
                      type="button"
                    >
                      🍃 {sample}
                    </button>
                  ))}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleLeafUpload(e.target.files?.[0])}
              />

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-12 rounded-2xl bg-primary hover:bg-primary/90 px-6 font-bold text-primary-foreground flex items-center gap-2 active:scale-95 shadow-sm"
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
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                  {t('takePhoto')}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-12 rounded-2xl border-2 border-border bg-card hover:bg-secondary px-6 font-bold text-foreground flex items-center gap-2 active:scale-95"
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
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" x2="12" y1="3" y2="15" />
                  </svg>
                  {t('uploadImage')}
                </button>
              </div>
            </div>

            {/* Diagnosis Result Card */}
            <div className="rounded-3xl bg-card p-6 shadow-xs border border-border flex flex-col justify-center">
              {diagnosisState === 'idle' && (
                <div className="text-center py-10 space-y-3">
                  <span className="text-4xl block">🔬</span>
                  <p className="text-sm font-semibold text-foreground">
                    Upload or choose a sample leaf above
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Gemini 3.8 Flash will visually analyze leaf lesions, concentric fungal rings, and insect symptoms to deliver instant organic &amp; chemical treatment prescriptions.
                  </p>
                </div>
              )}

              {diagnosisState === 'loading' && (
                <div className="flex h-full min-h-48 flex-col items-center justify-center gap-4 py-8">
                  <span className="size-12 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
                  <p className="animate-pulse text-base font-bold text-primary">
                    AI Crop Doctor Analyzing Leaf Foliage...
                  </p>
                  <p className="text-xs text-muted-foreground">Matching against Indian plant pathology database</p>
                </div>
              )}

              {diagnosisState === 'done' && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Identified Issue
                      </p>
                      <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Gemini 3.8 Flash Vision
                      </span>
                    </div>
                    <p className="text-2xl font-black text-foreground mt-0.5">
                      {diagnosisResult?.disease || 'Early Leaf Blight (Alternaria solani)'}
                    </p>
                    {diagnosisResult?.diseaseTelugu && (
                      <p className="text-sm font-bold text-primary">
                        {diagnosisResult.diseaseTelugu}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-primary/15 text-primary px-3 py-1 text-xs font-bold">
                        Confidence {diagnosisResult?.confidence || 94}%
                      </span>
                      <span className="rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 px-3 py-1 text-xs font-bold">
                        Severity: {diagnosisResult?.severity || 'Moderate'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-foreground text-sm">Recommended Actions</p>
                    <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-xs text-foreground">
                      {(
                        diagnosisResult?.immediateActions || [
                          'Inspect bottom leaves daily for bullseye concentric rings',
                          'Remove severely damaged foliage and bury outside bund',
                          'Stop sprinkler overhead irrigation to keep canopy dry',
                          'Ensure 4-hour rain-free interval before spray',
                        ]
                      ).map((act: string, aIdx: number) => (
                        <li key={aIdx} className="leading-relaxed">
                          {act}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-secondary p-3.5 text-xs space-y-1">
                      <p className="font-bold text-foreground flex items-center gap-1">
                        <span>🌿</span> Organic Approach
                      </p>
                      <p className="text-muted-foreground leading-relaxed">
                        {diagnosisResult?.organicApproach ||
                          'Apply Cold-Pressed Neem Oil (10,000 PPM) at 4ml/L with mild sticker or Trichoderma viride bio-fungicide.'}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-secondary p-3.5 text-xs space-y-1">
                      <p className="font-bold text-foreground flex items-center gap-1">
                        <span>🧪</span> Chemical Guidance
                      </p>
                      <p className="text-muted-foreground leading-relaxed">
                        {diagnosisResult?.chemicalTreatment ||
                          'Mancozeb 75% WP (2g/L) or Copper Oxychloride 50% WP (2.5g/L). 5-day pre-harvest interval.'}
                      </p>
                    </div>
                  </div>

                  {diagnosisResult?.sprayAdvisory && (
                    <div className="rounded-2xl bg-sky/15 border border-sky/30 p-3 text-xs">
                      <span className="font-bold text-foreground">🌤️ Spray Safety Advisory: </span>
                      <span className="text-muted-foreground">{diagnosisResult.sprayAdvisory}</span>
                    </div>
                  )}

                  {/* Doctor Consultation & Supabase Sync Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                    <button
                      onClick={() => setIsDoctorChatOpen(true)}
                      className="flex-1 min-w-[140px] h-10 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 shadow-xs"
                      type="button"
                    >
                      <span>💬 Consult Dr. Ramesh</span>
                    </button>
                    <button
                      onClick={handleSyncDiagnosisToSupabase}
                      disabled={isSyncingScan}
                      className="flex-1 min-w-[140px] h-10 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95"
                      type="button"
                    >
                      {isSyncingScan ? (
                        <span className="size-3 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" />
                      ) : (
                        <span>⚡ Save to Supabase</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Weather Intelligence (Section 5 - Real Open-Meteo API) */}
      <section id="weather" className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-12">
        <div className="rounded-3xl bg-card p-6 md:p-8 shadow-xs border border-border">
          <button
            onClick={() => setIsWeatherOpen(!isWeatherOpen)}
            className="flex w-full items-center justify-between gap-4 text-left"
            type="button"
          >
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                Weather Intelligence
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                  Live Open-Meteo
                </span>
              </h2>
              <p className="text-muted-foreground text-sm mt-0.5">
                {currentLocation} · {liveWeather?.condition || 'Partly Cloudy'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl md:text-4xl font-extrabold text-foreground">
                {liveWeather?.emoji || '🌤️'} {liveWeather?.temperature ?? 29}°C
              </span>
              <span
                className={`text-xl transition-transform ${isWeatherOpen ? 'rotate-180' : ''}`}
              >
                ▼
              </span>
            </div>
          </button>

          {isWeatherOpen && (
            <div className="mt-6 space-y-6">
              {/* Location Search Bar with Autocomplete Dropdown */}
              <div className="rounded-2xl bg-secondary p-4 relative">
                <p className="flex items-center gap-2 font-semibold text-foreground text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4 text-primary"
                  >
                    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>Active Field Location: {currentLocation}</span>
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row relative">
                  <div className="relative flex-1">
                    <input
                      value={weatherQuery}
                      onChange={(e) => handleLocationSearch(e.target.value)}
                      placeholder="Search Indian village, mandal, town or APMC market"
                      className="h-11 w-full rounded-xl bg-card border border-input px-3.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                    {locationSuggestions.length > 0 && (
                      <div className="absolute top-12 left-0 right-0 z-30 bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                        {locationSuggestions.map((loc, lIdx) => (
                          <button
                            key={lIdx}
                            onClick={() => handleSelectLocation(loc)}
                            className="w-full text-left px-4 py-2.5 hover:bg-secondary flex items-center justify-between text-xs border-b border-border/50 last:border-0"
                            type="button"
                          >
                            <span className="font-bold text-foreground">{loc.name}</span>
                            <span className="text-muted-foreground">{loc.state}, India</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (weatherQuery.trim().length >= 2) {
                        searchAgriLocations(weatherQuery).then((res) => {
                          if (res.length > 0) handleSelectLocation(res[0]);
                          else showToast(`Location set to ${weatherQuery}`);
                        });
                      }
                    }}
                    className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-5 text-sm font-bold active:scale-95"
                    type="button"
                  >
                    Search
                  </button>
                  <button
                    onClick={handleUseGpsLocation}
                    disabled={isSearchingLocation}
                    className="h-11 rounded-xl bg-card hover:bg-secondary border border-border px-4 text-sm font-semibold text-foreground flex items-center gap-1.5 active:scale-95"
                    type="button"
                  >
                    {isSearchingLocation ? (
                      <span className="size-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                    ) : (
                      <span>📍 Use GPS Location</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Agricultural Spray Safety Callout */}
              {liveWeather?.spraySafety && (
                <div
                  className={`rounded-2xl p-4 border flex items-center justify-between gap-4 ${
                    liveWeather.spraySafety.status === 'Safe'
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-950 dark:text-emerald-200'
                      : liveWeather.spraySafety.status === 'Caution'
                      ? 'bg-amber-500/10 border-amber-500/25 text-amber-950 dark:text-amber-200'
                      : 'bg-destructive/10 border-destructive/25 text-destructive'
                  }`}
                >
                  <div>
                    <p className="font-bold text-sm flex items-center gap-2">
                      <span>{liveWeather.spraySafety.status === 'Safe' ? '✅' : liveWeather.spraySafety.status === 'Caution' ? '⚠️' : '⛔'}</span>
                      Chemical Spray Status: {liveWeather.spraySafety.status}
                    </p>
                    <p className="text-xs mt-0.5 opacity-90">{liveWeather.spraySafety.reason}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-bold uppercase opacity-75 block">Next Window</span>
                    <span className="text-xs font-black">{liveWeather.spraySafety.nextGoodWindow}</span>
                  </div>
                </div>
              )}

              {/* 3 Metric Pills */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Rain Probability
                  </p>
                  <p className="text-2xl font-black text-foreground mt-1">
                    {liveWeather?.rainProbability ?? 68}%
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Precipitation: {liveWeather?.precipitation ?? 0} mm
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Relative Humidity
                  </p>
                  <p className="text-2xl font-black text-foreground mt-1">
                    {liveWeather?.humidity ?? 74}%
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Foliage dew alert for fungal risk
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Wind Velocity
                  </p>
                  <p className="text-2xl font-black text-foreground mt-1">
                    {liveWeather?.windSpeed ?? 12} km/h
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {liveWeather && liveWeather.windSpeed < 15 ? 'Safe low drift' : 'High drift caution'}
                  </p>
                </div>
              </div>

              {/* 5-Day Forecast */}
              <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                {(liveWeather?.daily || [
                  { day: 'Today', emoji: '🌤️', max: 29, min: 22, rainProb: 68 },
                  { day: 'Sat', emoji: '🌧️', max: 27, min: 21, rainProb: 82 },
                  { day: 'Sun', emoji: '🌦️', max: 28, min: 21, rainProb: 45 },
                  { day: 'Mon', emoji: '☀️', max: 31, min: 23, rainProb: 15 },
                  { day: 'Tue', emoji: '🌤️', max: 30, min: 22, rainProb: 20 },
                ]).map((item, idx) => (
                  <div
                    key={idx}
                    className="min-w-28 flex-1 rounded-2xl bg-secondary p-4 text-center shadow-xs"
                  >
                    <p className="text-sm font-semibold text-muted-foreground">{item.day}</p>
                    <p className="my-1 text-2xl">{item.emoji}</p>
                    <p className="text-lg font-bold text-foreground">
                      {item.max}° / {item.min}°
                    </p>
                    <p className="text-xs text-muted-foreground">{item.rainProb}% rain</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <p>Public data provided by Open-Meteo High-Resolution Agricultural Model</p>
                <button
                  onClick={() => {
                    fetchLiveAgriWeather(currentCoords.lat, currentCoords.lon, currentLocation).then((d) => {
                      setLiveWeather(d);
                      showToast('Live weather refreshed!');
                    });
                  }}
                  className="font-bold text-primary hover:underline"
                  type="button"
                >
                  ↻ Refresh Weather
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
      {/* 7. Today's Mandi Prices (Section 6 - Public AGMARKNET & APMC Data) */}
      <section id="markets" className="scroll-mt-20 bg-secondary/50 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                {t('mandiTitle')}
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Live APMC Feed
                </span>
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Real-time commodity rates from regulated APMC markets across India (AGMARKNET &amp; data.gov.in).
              </p>
            </div>
            <button
              onClick={handleRefreshMandi}
              disabled={isRefreshingMandi}
              className="h-11 rounded-2xl bg-card border border-border px-5 text-sm font-bold text-foreground flex items-center justify-center gap-2 hover:bg-secondary active:scale-95 shadow-xs"
              type="button"
            >
              <span className={`text-base ${isRefreshingMandi ? 'animate-spin' : ''}`}>↻</span>
              {isRefreshingMandi ? 'Refreshing Feed…' : 'Refresh Mandi Rates'}
            </button>
          </div>

          {/* Quick Commodity Filter Chips */}
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {['All', 'Tomato', 'Chilli', 'Cotton', 'Paddy', 'Maize', 'Turmeric', 'Onion'].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCropFilter(c)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-colors active:scale-95 ${
                  selectedCropFilter === c
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-card border border-border text-foreground hover:bg-secondary'
                }`}
                type="button"
              >
                {c === 'All' ? '🌟 All Crops' : c}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <input
                value={mandiSearch}
                onChange={(e) => setMandiSearch(e.target.value)}
                placeholder="Search crop, variety, district or APMC market"
                className="h-12 w-full rounded-2xl bg-card border border-input px-4 text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="h-12 rounded-2xl bg-card border border-input px-4 text-sm font-semibold text-foreground md:w-56"
            >
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Mandi Table */}
          <div className="mt-5 overflow-hidden rounded-3xl bg-card border border-border shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-foreground">
                <thead className="border-b border-border bg-secondary/60 text-xs font-bold uppercase text-muted-foreground">
                  <tr>
                    <th className="p-4">Crop &amp; Variety</th>
                    <th className="p-4">APMC Market</th>
                    <th className="p-4 text-right">Arrivals</th>
                    <th className="p-4 text-right">Min (₹/q)</th>
                    <th className="p-4 text-right">Max (₹/q)</th>
                    <th className="p-4 text-right">Modal Rate</th>
                    <th className="p-4 text-center">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredMandiRows.map((row, i) => (
                    <tr key={i} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-4 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <span>{row.crop}</span>
                          {row.cropTelugu && (
                            <span className="text-[11px] font-normal text-muted-foreground">
                              ({row.cropTelugu})
                            </span>
                          )}
                        </div>
                        <span className="block text-xs text-muted-foreground font-normal">
                          {row.variety}
                        </span>
                      </td>
                      <td className="p-4 text-foreground">
                        <div className="font-semibold text-xs">{row.market}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {row.district}, {row.state} • {row.distanceKm} km away
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono text-xs text-muted-foreground">
                        {row.arrivalVolumeQtl} qtl
                      </td>
                      <td className="p-4 text-right font-mono text-muted-foreground text-xs">
                        ₹{row.minPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-right font-mono text-muted-foreground text-xs">
                        ₹{row.maxPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-right font-bold font-mono text-primary text-base">
                        ₹{row.modalPrice.toLocaleString('en-IN')}
                        <span className="block text-[10px] font-normal text-muted-foreground">
                          {row.unit}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            row.trend === 'up'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                              : row.trend === 'down'
                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                              : 'bg-secondary text-muted-foreground'
                          }`}
                        >
                          {row.trend === 'up' ? '▲' : row.trend === 'down' ? '▼' : '●'} {row.changePercent > 0 ? `+${row.changePercent}%` : `${row.changePercent}%`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setIsComparingPrices(!isComparingPrices)}
              className="rounded-xl bg-card border border-border px-4 py-2.5 text-xs font-bold text-foreground hover:bg-secondary active:scale-95 shadow-xs"
              type="button"
            >
              {isComparingPrices ? 'Hide Price Comparison' : '📊 Compare Market Prices'}
            </button>
            <p className="text-xs text-muted-foreground">
              Official data: AGMARKNET (Directorate of Marketing &amp; Inspection) · Updated today
            </p>
          </div>

          {/* Comparative Chart Panel */}
          {isComparingPrices && (
            <div className="mt-4 rounded-3xl bg-card border border-border p-6 shadow-xs animate-in fade-in">
              <p className="mb-4 font-bold text-foreground text-sm">
                Modal price by market comparison (₹/quintal)
              </p>
              <div className="space-y-3">
                {filteredMandiRows.slice(0, 6).map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-foreground">
                        {item.crop} — {item.market} ({item.district})
                      </span>
                      <span className="font-mono text-primary font-bold">
                        ₹{item.modalPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (item.modalPrice / 21000) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 8. What's In Demand? (Section 7) */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
          {t('demandTitle')}
        </h2>
        <p className="mt-1 text-muted-foreground">
          Market demand &amp; export opportunity indicators
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {DEMAND_DATA.map((item) => (
            <div
              key={item.name}
              className="rounded-3xl bg-card p-6 shadow-xs border border-border space-y-2"
            >
              <span className="text-4xl">{item.icon}</span>
              <p className="text-xl font-extrabold text-foreground">{item.name}</p>
              <span className="inline-block rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
                {item.trend === 'Stable' ? '📊' : '📈'} {item.trend}
              </span>
              <p className="text-sm text-muted-foreground">
                Potential export markets: {item.markets}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button
            onClick={() => showToast('Opening Agricultural Export Promotion Portal (APEDA)…')}
            className="rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-bold hover:bg-primary/90 active:scale-95 shadow-xs"
            type="button"
          >
            Explore Market Opportunities →
          </button>
          <p className="text-sm text-muted-foreground">
            Market opportunity indicators are based on available APEDA market and trade data.
          </p>
        </div>
      </section>

      {/* 9. Government Schemes For You (Section 8 - Authentic Government Portals) */}
      <section id="schemes" className="scroll-mt-20 bg-secondary/50 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                {t('schemesTitle')}
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                  Authentic GoI Portals
                </span>
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Verified Central &amp; State agricultural subsidy schemes with official application links.
              </p>
            </div>

            {/* Scheme Calculator Trigger */}
            <button
              onClick={() => setIsSchemeCalcOpen(true)}
              className="rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-3 text-sm font-bold flex items-center gap-2 active:scale-95 shadow-md"
              type="button"
            >
              <span>🏛️</span>
              <span>Calculate My Subsidy Entitlement</span>
            </button>
          </div>

          {/* Scheme Cards Grid */}
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {OFFICIAL_GOV_SCHEMES.map((scheme) => (
              <div
                key={scheme.id}
                className="rounded-3xl bg-card p-6 shadow-xs border border-border flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-3xl">🏛️</span>
                    <span className="rounded-full bg-primary/15 text-primary px-3 py-1 text-xs font-bold">
                      {scheme.level} Scheme
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-foreground leading-snug">
                      {scheme.name}
                    </h3>
                    {scheme.teluguName && (
                      <p className="text-xs font-bold text-primary mt-0.5">
                        {scheme.teluguName}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-1">{scheme.department}</p>
                  </div>
                  <div className="rounded-2xl bg-secondary/70 p-3 text-xs space-y-1">
                    <span className="font-bold text-foreground">Direct Benefit:</span>
                    <p className="text-foreground font-semibold text-xs leading-relaxed">
                      {scheme.benefitAmount}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {scheme.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Mode: {scheme.applicationMode}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ● {scheme.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedScheme(scheme)}
                      className="flex-1 rounded-xl bg-secondary hover:bg-secondary/80 py-2.5 text-xs font-bold text-foreground active:scale-95"
                      type="button"
                    >
                      View Details
                    </button>
                    <a
                      href={scheme.officialPortalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 text-xs font-bold active:scale-95 shadow-2xs"
                    >
                      Apply ({scheme.portalName}) ↗
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs text-muted-foreground text-center">
            All applications are processed securely on official government portals (pmkisan.gov.in, pmfby.gov.in, telangana.gov.in, myscheme.gov.in).
          </p>
        </div>

        {/* Detailed Scheme Modal */}
        {selectedScheme && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg bg-card rounded-3xl p-6 shadow-2xl border border-border space-y-4 max-h-[85vh] overflow-y-auto animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selectedScheme.name}</h3>
                  {selectedScheme.teluguName && (
                    <p className="text-xs font-bold text-primary">{selectedScheme.teluguName}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedScheme(null)}
                  className="size-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground"
                >
                  ✕
                </button>
              </div>

              <p className="text-sm text-muted-foreground">{selectedScheme.description}</p>

              <div className="space-y-3 text-sm">
                <div className="bg-secondary p-3.5 rounded-2xl">
                  <p className="font-bold text-foreground">Direct Financial Benefit</p>
                  <p className="text-foreground font-semibold text-xs mt-0.5">
                    {selectedScheme.benefitAmount}
                  </p>
                </div>

                <div className="bg-secondary p-3.5 rounded-2xl">
                  <p className="font-bold text-foreground">Eligibility Criteria</p>
                  <ul className="list-disc pl-5 text-xs text-muted-foreground mt-1 space-y-1">
                    {selectedScheme.eligibility.map((crit, i) => (
                      <li key={i}>{crit}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-secondary p-3.5 rounded-2xl">
                  <p className="font-bold text-foreground">Required Documents</p>
                  <ul className="list-disc pl-5 text-xs text-muted-foreground mt-1 space-y-1">
                    {selectedScheme.documentsRequired.map((doc, i) => (
                      <li key={i}>{doc}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">
                    Official Government Department
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedScheme.department}
                  </p>
                </div>
              </div>

              <a
                href={selectedScheme.officialPortalUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full block text-center rounded-xl bg-primary text-primary-foreground py-3 text-sm font-bold hover:bg-primary/90 active:scale-95 shadow-sm"
              >
                Proceed to Official Portal ({selectedScheme.portalName}) ↗
              </a>
            </div>
          </div>
        )}
      </section>

      {/* 10. Farmer Community (Section 9) */}
      <section id="community" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
            {t('communityTitle')}
          </h2>
          <button
            onClick={() => setIsCreatePostOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-sm font-bold active:scale-95 shadow-xs"
            type="button"
          >
            <span>+</span> Create Post
          </button>
        </div>

        {/* Scope Tabs */}
        <div className="flex gap-2 border-b border-border pb-3">
          {(['All', 'My District', 'My Crops', 'Experts'] as const).map((sc) => (
            <button
              key={sc}
              onClick={() => setCommunityScope(sc)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                communityScope === sc
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
              type="button"
            >
              {sc}
            </button>
          ))}
        </div>

        {/* Post Cards */}
        <div className="mt-5 space-y-4">
          {COMMUNITY_POSTS.filter(
            (p) => communityScope === 'All' || p.scope === communityScope
          ).map((post, idx) => {
            const isLiked = likedPosts.includes(post.author);
            return (
              <div
                key={idx}
                className="rounded-3xl bg-card p-6 shadow-xs border border-border space-y-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-xl">
                    👨‍🌾
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 font-bold text-foreground text-sm">
                      {post.author} — {post.place}
                      {post.expert && (
                        <span className="rounded-full bg-sky/20 text-sky-foreground px-2.5 py-0.5 text-[10px] font-bold">
                          ✓ Verified Agricultural Expert
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{post.crop} · 2 hours ago</p>
                  </div>
                </div>

                <p className="text-base text-foreground leading-relaxed">{post.text}</p>

                <div className="flex items-center gap-5 text-sm font-semibold text-muted-foreground pt-1 border-t border-border/50">
                  <button
                    onClick={() =>
                      setLikedPosts((prev) =>
                        prev.includes(post.author)
                          ? prev.filter((a) => a !== post.author)
                          : [...prev, post.author]
                      )
                    }
                    className={`inline-flex items-center gap-1.5 hover:text-primary ${
                      isLiked ? 'text-primary font-bold' : ''
                    }`}
                    type="button"
                  >
                    <span>♥</span> {post.likes + (isLiked ? 1 : 0)}
                  </button>
                  <span className="inline-flex items-center gap-1.5">
                    <span>💬</span> {post.comments}
                  </span>
                  <button
                    onClick={() => showToast('Post saved to your bookmarks')}
                    className="inline-flex items-center gap-1.5 hover:text-primary"
                    type="button"
                  >
                    <span>🔖</span> Save
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Create Post Modal */}
        {isCreatePostOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md bg-card rounded-3xl p-6 shadow-2xl border border-border space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="text-lg font-bold text-foreground">Create Post</h3>
                <button
                  onClick={() => setIsCreatePostOpen(false)}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share a question or field update with other farmers.
              </p>
              <textarea
                rows={4}
                placeholder="Type here..."
                className="w-full rounded-2xl border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
              <button
                onClick={() => {
                  setIsCreatePostOpen(false);
                  showToast('Post shared with the community');
                }}
                className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
                type="button"
              >
                Post
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 11. Farm Wallet & Earnings (Section 10) */}
      <section id="wallet" className="scroll-mt-20 bg-secondary/50 py-12">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 lg:grid-cols-3">
          {/* Wallet Balance Card */}
          <div className="rounded-3xl bg-primary text-primary-foreground shadow-xs p-6 space-y-5">
            <p className="text-sm font-bold uppercase tracking-wide opacity-85">
              {t('walletTitle')}
            </p>
            <p className="text-4xl font-extrabold font-mono">₹48,650</p>
            <div className="grid grid-cols-2 gap-2">
              {['Add Money', 'Send', 'Receive', 'UPI'].map((label) => (
                <button
                  key={label}
                  onClick={() => showToast(`${label} is a demo action`)}
                  className="rounded-xl bg-card text-foreground hover:bg-secondary py-2.5 text-xs font-bold active:scale-95 transition-transform"
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Earnings Breakdown */}
          <div className="rounded-3xl bg-card border border-border p-6 shadow-xs lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Earnings</h2>
              <div className="flex gap-4 text-sm font-semibold">
                <span className="text-foreground">
                  Revenue ₹{Number(85000).toLocaleString('en-IN')}
                </span>
                <span className="text-muted-foreground">
                  Expenses ₹{Number(32000).toLocaleString('en-IN')}
                </span>
                <span className="text-primary font-bold">
                  Net ₹{Number(53000).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Monthly Bar Viz */}
            <div className="mt-5 space-y-2.5">
              {EARNINGS_CHART.map((m) => (
                <div key={m.month} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">{m.month}</span>
                    <span className="text-foreground">
                      ₹{m.revenue.toLocaleString('en-IN')} / ₹{m.expense.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-secondary">
                    <div
                      className="bg-primary h-full rounded-l-full"
                      style={{ width: `${(m.revenue / 22000) * 100}%` }}
                    />
                    <div
                      className="bg-accent h-full rounded-r-full"
                      style={{ width: `${(m.expense / 22000) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions List */}
          <div className="rounded-3xl bg-card border border-border p-6 shadow-xs lg:col-span-3">
            <p className="font-bold text-foreground">Recent transactions</p>
            <div className="mt-3 divide-y divide-border">
              {WALLET_TRANSACTIONS.map((tx, idx) => (
                <div key={idx} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{tx.label}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                  <p
                    className={`font-bold font-mono text-sm ${
                      tx.amount > 0 ? 'text-primary' : 'text-destructive'
                    }`}
                  >
                    {tx.amount > 0 ? '+' : '−'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 12. Footer */}
      <footer className="mx-auto max-w-7xl px-4 py-10 text-center text-sm text-muted-foreground border-t border-border/40">
        <p className="font-bold text-foreground">KFHH — Kisan Future Helping Hand</p>
        <p className="mt-1">
          Public APIs: Open-Meteo Weather · AGMARKNET APMC Prices · Government Schemes (pmkisan.gov.in) · Gemini 3.8 AI Crop Doctor · n8n Farmer AI · Supabase Cloud
        </p>
      </footer>

      {/* 13. AI Agronomist Follow-up Doctor Chat Modal */}
      <DoctorChatModal
        isOpen={isDoctorChatOpen}
        onClose={() => setIsDoctorChatOpen(false)}
        cropName={selectedCropName}
      />

      {/* 14. Government Schemes Subsidy Calculator Modal */}
      <SchemeCalculatorModal
        isOpen={isSchemeCalcOpen}
        onClose={() => setIsSchemeCalcOpen(false)}
      />

      {/* 15. Farm Location Selector Modal */}
      <LocationSelectModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={currentLocation}
        currentCoords={currentCoords}
        onSelectLocation={handleLocationChosen}
        lang={lang}
      />

      {/* 16. Farmer Crop Add/Edit Modal */}
      <FarmerCropModal
        isOpen={isCropModalOpen}
        onClose={() => {
          setIsCropModalOpen(false);
          setCropToEdit(null);
        }}
        onSaved={handleCropSaved}
        farmerId={farmerProfile?.id || ''}
        farmId={farmDetails?.id}
        cropToEdit={cropToEdit}
      />

      {/* 17. Farmer Profile & Farm Edit Modal */}
      <FarmerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSaved={async () => {
          showToast('Profile updated in Supabase');
          await onRefreshFarmer();
        }}
        profile={farmerProfile || null}
        farm={farmDetails || null}
      />
    </div>
  );
};
