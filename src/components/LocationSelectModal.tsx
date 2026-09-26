import React, { useState, useEffect, useRef } from 'react';
import { LocationResult, searchAgriLocations, reverseGeocodeGPS } from '../services/api';
import { Language } from '../data/kfhhData';

export interface LocationSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: string;
  currentCoords: { lat: number; lon: number };
  onSelectLocation: (loc: { name: string; state: string; lat: number; lon: number }) => void;
  lang?: Language;
}

interface CuratedHub {
  name: string;
  district: string;
  state: string;
  crops: string;
  lat: number;
  lon: number;
}

type HubRegion = 'Telangana' | 'Andhra Pradesh' | 'Maharashtra' | 'Karnataka' | 'Punjab & North';

const POPULAR_HUBS: Record<HubRegion, CuratedHub[]> = {
  Telangana: [
    { name: 'Warangal Rural', district: 'Warangal', state: 'Telangana', crops: 'Cotton, Chilli, Paddy', lat: 17.9784, lon: 79.5941 },
    { name: 'Khammam', district: 'Khammam', state: 'Telangana', crops: 'Chilli, Maize, Mango', lat: 17.2473, lon: 80.1514 },
    { name: 'Nizamabad', district: 'Nizamabad', state: 'Telangana', crops: 'Turmeric, Paddy, Soy', lat: 18.6725, lon: 78.0941 },
    { name: 'Karimnagar', district: 'Karimnagar', state: 'Telangana', crops: 'Paddy, Cotton, Corn', lat: 18.4386, lon: 79.1288 },
    { name: 'Mahabubnagar', district: 'Mahabubnagar', state: 'Telangana', crops: 'Castor, Groundnut, Cotton', lat: 16.7488, lon: 77.9943 },
    { name: 'Nalgonda', district: 'Nalgonda', state: 'Telangana', crops: 'Paddy, Sweet Lime, Cotton', lat: 17.0575, lon: 79.2684 },
    { name: 'Hyderabad (Bowenpally)', district: 'Hyderabad', state: 'Telangana', crops: 'State Terminal APMC Mandi', lat: 17.4722, lon: 78.4878 },
  ],
  'Andhra Pradesh': [
    { name: 'Guntur', district: 'Guntur', state: 'Andhra Pradesh', crops: 'Chilli (Asia largest mandi), Tobacco', lat: 16.3067, lon: 80.4365 },
    { name: 'Vijayawada', district: 'Krishna', state: 'Andhra Pradesh', crops: 'Paddy, Sugarcane, Mango', lat: 16.5062, lon: 80.6480 },
    { name: 'Kurnool', district: 'Kurnool', state: 'Andhra Pradesh', crops: 'Onion, Cotton, Sunflower', lat: 15.8281, lon: 78.0373 },
    { name: 'Anantapur', district: 'Anantapur', state: 'Andhra Pradesh', crops: 'Groundnut, Sweet Orange, Pomegranate', lat: 14.6819, lon: 77.6006 },
    { name: 'Rajahmundry', district: 'East Godavari', state: 'Andhra Pradesh', crops: 'Paddy Delta, Coconut, Cashew', lat: 17.0005, lon: 81.8040 },
    { name: 'Chittoor', district: 'Chittoor', state: 'Andhra Pradesh', crops: 'Tomato, Mango Pulp, Sugarcane', lat: 13.2172, lon: 79.1003 },
  ],
  Maharashtra: [
    { name: 'Nashik', district: 'Nashik', state: 'Maharashtra', crops: 'Onion Mandi Hub, Table Grapes', lat: 19.9975, lon: 73.7898 },
    { name: 'Pune (Gultekdi)', district: 'Pune', state: 'Maharashtra', crops: 'Sugarcane, Vegetables, Floriculture', lat: 18.5204, lon: 73.8567 },
    { name: 'Nagpur', district: 'Nagpur', state: 'Maharashtra', crops: 'Mandarin Orange, Cotton, Soybean', lat: 21.1458, lon: 79.0882 },
    { name: 'Solapur', district: 'Solapur', state: 'Maharashtra', crops: 'Pomegranate, Jowar, Grapes', lat: 17.6599, lon: 75.9064 },
    { name: 'Kolhapur', district: 'Kolhapur', state: 'Maharashtra', crops: 'Sugarcane, Jaggery, Soy', lat: 16.7050, lon: 74.2433 },
  ],
  Karnataka: [
    { name: 'Hubballi-Dharwad', district: 'Dharwad', state: 'Karnataka', crops: 'Cotton, Bengal Gram, Chilli', lat: 15.3647, lon: 75.1240 },
    { name: 'Belagavi', district: 'Belagavi', state: 'Karnataka', crops: 'Sugarcane, Vegetables, Paddy', lat: 15.8497, lon: 74.4977 },
    { name: 'Mysuru', district: 'Mysuru', state: 'Karnataka', crops: 'Paddy, Mulberry, Spices', lat: 12.2958, lon: 76.6394 },
    { name: 'Davanagere', district: 'Davanagere', state: 'Karnataka', crops: 'Maize Mandi Hub, Paddy', lat: 14.4644, lon: 75.9218 },
  ],
  'Punjab & North': [
    { name: 'Ludhiana', district: 'Ludhiana', state: 'Punjab', crops: 'Wheat, Paddy, PAU Research Hub', lat: 30.9010, lon: 75.8573 },
    { name: 'Karnal', district: 'Karnal', state: 'Haryana', crops: 'Basmati Rice, Wheat Seed Hub', lat: 29.6857, lon: 76.9905 },
    { name: 'Bathinda', district: 'Bathinda', state: 'Punjab', crops: 'Cotton Belt, Mustard, Wheat', lat: 30.2110, lon: 74.9455 },
    { name: 'Indore', district: 'Indore', state: 'Madhya Pradesh', crops: 'Soybean Mandi Capital, Wheat', lat: 22.7196, lon: 75.8577 },
    { name: 'Rajkot', district: 'Rajkot', state: 'Gujarat', crops: 'Groundnut, Cotton, Cumin', lat: 22.3039, lon: 70.8022 },
  ],
};

export const LocationSelectModal: React.FC<LocationSelectModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  currentCoords,
  onSelectLocation,
  lang = 'en',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'Telangana' | 'Andhra Pradesh' | 'Maharashtra' | 'Karnataka' | 'Punjab & North'>('Telangana');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
      setSearchResults([]);
      setGpsError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const res = await searchAgriLocations(searchQuery.trim());
          setSearchResults(res);
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handlePickLocation = (loc: { name: string; state: string; lat: number; lon: number }) => {
    onSelectLocation(loc);
    onClose();
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const placeName = await reverseGeocodeGPS(latitude, longitude);
          const parts = placeName.split(',');
          const name = parts[0]?.trim() || 'My Farm';
          const state = parts.length > 1 ? parts[parts.length - 2]?.trim() || 'Telangana' : 'Telangana';

          handlePickLocation({
            name: placeName,
            state,
            lat: latitude,
            lon: longitude,
          });
        } catch (err: any) {
          setGpsError('Could not decode location coordinates.');
        } finally {
          setIsDetectingGps(false);
        }
      },
      (err) => {
        setIsDetectingGps(false);
        setGpsError(err.message || 'GPS permission denied or timed out.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 transition-opacity animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-card border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border p-4 sm:p-5 bg-background">
          <div className="flex items-center gap-3">
            <span className="size-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center text-xl font-bold">
              📍
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-foreground leading-tight">
                {lang === 'te' ? 'మీ వ్యవసాయ క్షేత్ర ప్రాంతాన్ని ఎంచుకోండి' : lang === 'hi' ? 'अपना खेत / मंडी स्थान चुनें' : 'Select Farm & Mandi Location'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {lang === 'te'
                  ? 'వాతావరణం, మండి ధరలు మరియు స్థానిక సలహాలు ఖచ్చితంగా అందుతాయి'
                  : lang === 'hi'
                  ? 'सटीक मौसम, लाइव मंडी भाव और स्थानीय कृषि सलाह'
                  : 'Powering live Open-Meteo weather, APMC mandi rates & regional agro-advice'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
            aria-label="Close"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Current Location Badge & GPS Quick Action */}
        <div className="p-4 sm:p-5 border-b border-border bg-muted/20 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Current:</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/25 px-3 py-1 text-xs font-bold text-primary">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                {currentLocation || 'Telangana, India'}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono hidden sm:inline">
                ({currentCoords.lat.toFixed(2)}°, {currentCoords.lon.toFixed(2)}°)
              </span>
            </div>

            <button
              onClick={handleUseGps}
              disabled={isDetectingGps}
              type="button"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60"
            >
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
                className={isDetectingGps ? 'animate-spin' : ''}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="22" y1="12" x2="18" y2="12" />
                <line x1="6" y1="12" x2="2" y2="12" />
                <line x1="12" y1="6" x2="12" y2="2" />
                <line x1="12" y1="22" x2="12" y2="18" />
              </svg>
              <span>{isDetectingGps ? 'Locating via GPS...' : 'Detect My GPS Location'}</span>
            </button>
          </div>

          {gpsError && (
            <p className="text-[11px] text-destructive bg-destructive/10 px-2.5 py-1.5 rounded-lg border border-destructive/20">
              ⚠️ {gpsError}
            </p>
          )}

          {/* Search Box */}
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Indian district, mandal, town (e.g. Warangal, Guntur, Nashik)..."
              className="w-full rounded-2xl border border-border bg-background pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground size-5 rounded-full bg-secondary flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content Body: Search Results or Curated Regional Hubs */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {searchQuery.trim().length >= 2 ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Search Results {searchResults.length > 0 ? `(${searchResults.length})` : ''}
                </span>
                {isSearching && (
                  <span className="text-xs text-primary animate-pulse font-medium">Searching Open-Meteo...</span>
                )}
              </div>

              {searchResults.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {searchResults.map((res, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        handlePickLocation({
                          name: `${res.name}, ${res.state}`,
                          state: res.state,
                          lat: res.latitude,
                          lon: res.longitude,
                        })
                      }
                      className="flex items-start gap-2.5 p-3 rounded-2xl border border-border bg-background hover:bg-primary/5 hover:border-primary/40 transition-all text-left group active:scale-[0.99]"
                    >
                      <span className="size-8 rounded-xl bg-secondary flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0 mt-0.5">
                        📍
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-foreground truncate group-hover:text-primary">
                          {res.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {res.district ? `${res.district}, ` : ''}{res.state}, {res.country}
                        </p>
                        <p className="text-[10px] text-muted-foreground/80 font-mono mt-0.5">
                          {res.latitude.toFixed(2)}°N, {res.longitude.toFixed(2)}°E
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : !isSearching ? (
                <div className="p-8 text-center bg-secondary/30 rounded-2xl border border-border/60">
                  <p className="text-2xl mb-1">🌾</p>
                  <p className="font-bold text-foreground text-sm">No specific location matched "{searchQuery}"</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try searching by district name or pick from the popular agricultural belts below.
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <div>
              {/* Regional Agricultural Belts Tabs */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Major Agricultural Hubs & Mandis
                </span>
                <span className="text-[11px] text-primary font-medium">Click to select</span>
              </div>

              {/* State Pills */}
              <div className="flex flex-wrap gap-1.5 pb-2 border-b border-border/50">
                {(Object.keys(POPULAR_HUBS) as HubRegion[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setActiveTab(st)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      activeTab === st
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Hub Cards */}
              <div className="grid gap-2.5 sm:grid-cols-2 mt-3">
                {POPULAR_HUBS[activeTab]?.map((hub, idx) => {
                  const isSelected =
                    currentLocation.toLowerCase().includes(hub.name.toLowerCase()) ||
                    currentLocation.toLowerCase().includes(hub.district.toLowerCase());

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        handlePickLocation({
                          name: `${hub.name}, ${hub.state}`,
                          state: hub.state,
                          lat: hub.lat,
                          lon: hub.lon,
                        })
                      }
                      className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition-all active:scale-[0.99] group ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border bg-background hover:border-primary/40 hover:bg-secondary/40'
                      }`}
                    >
                      <div
                        className={`size-9 rounded-xl flex items-center justify-center shrink-0 text-base font-bold transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                        }`}
                      >
                        🌾
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-bold text-sm text-foreground truncate group-hover:text-primary">
                            {hub.name}
                          </p>
                          {isSelected && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-primary/15 text-primary shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {hub.district}, {hub.state}
                        </p>
                        <p className="text-[11px] text-primary/90 font-medium truncate mt-0.5">
                          {hub.crops}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-border bg-background flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            Automatic forecast & mandi sync
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-secondary font-bold text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
