import React, { useState } from 'react';
import {
  registerFarmer,
  loginFarmer,
  FarmerProfile,
  InitialCropInput,
} from '../services/farmerService';
import { Language } from '../data/kfhhData';

export interface FarmerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: FarmerProfile) => void;
  lang?: Language;
  initialMode?: 'register' | 'login';
}

const COMMON_CROPS = [
  'Paddy (వరి)',
  'Cotton (పత్తి)',
  'Chilli (మిరప)',
  'Tomato (టమాటా)',
  'Maize (మొక్కజొన్న)',
  'Turmeric (పసుపు)',
  'Groundnut (వేరుశనగ)',
  'Onion (ఉల్లి)',
  'Sugarcane (చెరకు)',
  'Wheat (గోధుమ)',
];

const STATES = [
  'Telangana',
  'Andhra Pradesh',
  'Maharashtra',
  'Karnataka',
  'Punjab',
  'Haryana',
  'Madhya Pradesh',
  'Gujarat',
  'Uttar Pradesh',
  'Tamil Nadu',
  'Bihar',
  'Rajasthan',
  'West Bengal',
  'Odisha',
];

export const FarmerAuthModal: React.FC<FarmerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lang = 'en',
  initialMode = 'register',
}) => {
  const [mode, setMode] = useState<'register' | 'login'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Registration Form State
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [pin, setPin] = useState('');
  const [state, setState] = useState('Telangana');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [prefLang, setPrefLang] = useState<string>(lang || 'en');
  const [mainCrop, setMainCrop] = useState('');
  const [landArea, setLandArea] = useState('3.0');
  const [landAreaUnit, setLandAreaUnit] = useState('Acres');
  const [additionalCrops, setAdditionalCrops] = useState<InitialCropInput[]>([]);

  // Login Form State
  const [loginMobile, setLoginMobile] = useState('');
  const [loginPin, setLoginPin] = useState('');

  if (!isOpen) return null;

  const handleAddAnotherCrop = () => {
    setAdditionalCrops((prev) => [
      ...prev,
      {
        crop_name: '',
        variety: '',
        area: 1,
        area_unit: landAreaUnit,
        season: 'Rabi',
      },
    ]);
  };

  const handleRemoveAdditionalCrop = (index: number) => {
    setAdditionalCrops((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateAdditionalCrop = (index: number, field: keyof InitialCropInput, value: any) => {
    setAdditionalCrops((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (mobileNumber.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (pin.length < 4) {
      setError('Please enter a 4-digit security PIN.');
      return;
    }
    if (!state.trim() || !district.trim() || !village.trim()) {
      setError('State, District, and Village are required.');
      return;
    }
    if (!mainCrop.trim()) {
      setError('Please select or enter your main crop.');
      return;
    }

    setLoading(true);
    const result = await registerFarmer({
      full_name: fullName,
      mobile_number: mobileNumber,
      pin,
      state,
      district,
      village,
      preferred_language: prefLang,
      main_crop: mainCrop,
      land_area: parseFloat(landArea) || 1,
      land_area_unit: landAreaUnit,
      additional_crops: additionalCrops,
    });
    setLoading(false);

    if (result.success && result.profile) {
      onSuccess(result.profile);
      onClose();
    } else {
      setError(result.error || 'Failed to complete registration. Please check Supabase connection.');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (loginMobile.replace(/\D/g, '').length < 10) {
      setError('Please enter your registered 10-digit mobile number.');
      return;
    }
    if (loginPin.length < 4) {
      setError('Please enter your 4-digit security PIN.');
      return;
    }

    setLoading(true);
    const result = await loginFarmer(loginMobile, loginPin);
    setLoading(false);

    if (result.success && result.profile) {
      onSuccess(result.profile);
      onClose();
    } else {
      setError(result.error || 'Login failed. Please check mobile number & PIN.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-card border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border p-4 sm:p-5 bg-background">
          <div className="flex items-center gap-3">
            <span className="size-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center text-xl font-bold">
              👨‍🌾
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-foreground leading-tight">
                {mode === 'register' ? 'Farmer Registration' : 'Farmer Login'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {mode === 'register'
                  ? 'Connect your real farm profile & crops to Supabase'
                  : 'Access your saved farm records, crops, and personalized advice'}
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

        {/* Tab Switcher: Register / Login */}
        <div className="flex border-b border-border bg-muted/30 p-1.5 gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              mode === 'register'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            New Farmer Registration
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              mode === 'login'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Login to Existing Farm
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {mode === 'register' ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Section: Personal Info */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  1. Farmer Details
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ravi Kumar"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 9876543210"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      4-Digit Security PIN *
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="e.g. 1234"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                    />
                    <span className="text-[10px] text-muted-foreground">Used to log back into your farm account.</span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      Preferred Language
                    </label>
                    <select
                      value={prefLang}
                      onChange={(e) => setPrefLang(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                    >
                      <option value="en">English</option>
                      <option value="te">తెలుగు (Telugu)</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section: Location */}
              <div className="pt-2 border-t border-border">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  2. Farm Location
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      State *
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                    >
                      {STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      District *
                    </label>
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Nalgonda"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      Village *
                    </label>
                    <input
                      type="text"
                      required
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder="e.g. Miryalaguda"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Farm & Main Crop */}
              <div className="pt-2 border-t border-border">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  3. Farm &amp; Crops
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      Main Crop *
                    </label>
                    <input
                      type="text"
                      required
                      value={mainCrop}
                      onChange={(e) => setMainCrop(e.target.value)}
                      placeholder="e.g. Paddy or Cotton"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                    />

                    {/* Quick crop pills */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {COMMON_CROPS.slice(0, 5).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setMainCrop(c.split(' ')[0])}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-secondary hover:bg-primary/20 text-foreground transition-colors"
                        >
                          {c.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">
                        Land Area *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        required
                        value={landArea}
                        onChange={(e) => setLandArea(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">
                        Unit
                      </label>
                      <select
                        value={landAreaUnit}
                        onChange={(e) => setLandAreaUnit(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                      >
                        <option value="Acres">Acres</option>
                        <option value="Hectares">Hectares</option>
                        <option value="Guntas">Guntas</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Additional Crops list */}
                {additionalCrops.length > 0 && (
                  <div className="mt-3 space-y-2.5">
                    <p className="text-xs font-bold text-muted-foreground">Additional Crops:</p>
                    {additionalCrops.map((extra, idx) => (
                      <div
                        key={idx}
                        className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl bg-secondary/40 border border-border"
                      >
                        <input
                          type="text"
                          placeholder="Crop name (e.g. Chilli)"
                          value={extra.crop_name}
                          onChange={(e) => handleUpdateAdditionalCrop(idx, 'crop_name', e.target.value)}
                          className="flex-1 min-w-[120px] rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
                        />
                        <input
                          type="text"
                          placeholder="Variety (optional)"
                          value={extra.variety || ''}
                          onChange={(e) => handleUpdateAdditionalCrop(idx, 'variety', e.target.value)}
                          className="w-28 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
                        />
                        <input
                          type="number"
                          step="0.5"
                          placeholder="Acres"
                          value={extra.area || ''}
                          onChange={(e) =>
                            handleUpdateAdditionalCrop(idx, 'area', parseFloat(e.target.value) || 1)
                          }
                          className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveAdditionalCrop(idx)}
                          className="size-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center text-xs font-bold hover:bg-destructive/20"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddAnotherCrop}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <span>+</span> Add another crop
                </button>
              </div>

              {/* Submit CTA */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-primary py-3 px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-xs"
                >
                  {loading ? (
                    <>
                      <span className="size-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    <span>Complete Registration &amp; Open Dashboard</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4 py-2">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Registered Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={loginMobile}
                  onChange={(e) => setLoginMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Security PIN *
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  placeholder="4-digit PIN"
                  className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-primary py-3 px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-xs"
                >
                  {loading ? (
                    <>
                      <span className="size-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                      <span>Authenticating with Supabase...</span>
                    </>
                  ) : (
                    <span>Login to My Farm</span>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  Don't have a profile yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                    }}
                    className="font-bold text-primary hover:underline"
                  >
                    Register here
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
