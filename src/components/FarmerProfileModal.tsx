import React, { useState, useEffect } from 'react';
import {
  FarmerProfile,
  FarmDetails,
  updateFarmerProfile,
  updateFarm,
} from '../services/farmerService';

export interface FarmerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  profile: FarmerProfile | null;
  farm: FarmDetails | null;
}

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

export const FarmerProfileModal: React.FC<FarmerProfileModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  profile,
  farm,
}) => {
  const [fullName, setFullName] = useState('');
  const [state, setState] = useState('Telangana');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [prefLang, setPrefLang] = useState('en');
  const [landArea, setLandArea] = useState('1.0');
  const [landAreaUnit, setLandAreaUnit] = useState('Acres');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setState(profile.state || 'Telangana');
      setDistrict(profile.district || '');
      setVillage(profile.village || '');
      setPrefLang(profile.preferred_language || 'en');
    }
    if (farm) {
      setLandArea(farm.land_area ? String(farm.land_area) : '1.0');
      setLandAreaUnit(farm.land_area_unit || 'Acres');
    }
    setError(null);
  }, [profile, farm, isOpen]);

  if (!isOpen || !profile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !village.trim() || !district.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pRes = await updateFarmerProfile(profile.id, {
        full_name: fullName.trim(),
        state,
        district: district.trim(),
        village: village.trim(),
        preferred_language: prefLang,
      });

      if (!pRes.success) {
        throw new Error(pRes.error || 'Failed to update profile');
      }

      if (farm) {
        await updateFarm(farm.id, {
          land_area: parseFloat(landArea) || 1,
          land_area_unit: landAreaUnit,
          village: village.trim(),
          district: district.trim(),
          state,
        });
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error saving changes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border p-4 sm:p-5 bg-background">
          <div className="flex items-center gap-2.5">
            <span className="size-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center text-lg font-bold">
              👨‍🌾
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-foreground">
              Edit Farmer Profile &amp; Farm
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground text-sm font-bold"
            type="button"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                State *
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-2.5 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
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
                className="w-full rounded-xl border border-border bg-background px-2.5 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
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
                className="w-full rounded-xl border border-border bg-background px-2.5 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Total Land Area
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={landArea}
                onChange={(e) => setLandArea(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Area Unit
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

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-secondary text-sm font-bold text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 flex items-center gap-1.5 shadow-xs"
            >
              {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
