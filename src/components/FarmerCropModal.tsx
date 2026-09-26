import React, { useState, useEffect } from 'react';
import { FarmerCrop, addCrop, updateCrop } from '../services/farmerService';

export interface FarmerCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (crop: FarmerCrop) => void;
  farmerId: string;
  farmId?: string | null;
  cropToEdit?: FarmerCrop | null;
}

const COMMON_CROP_NAMES = [
  'Paddy',
  'Cotton',
  'Chilli',
  'Tomato',
  'Maize',
  'Turmeric',
  'Groundnut',
  'Onion',
  'Sugarcane',
  'Wheat',
  'Soybean',
  'Red Gram (Toor)',
  'Bengal Gram (Chana)',
];

export const FarmerCropModal: React.FC<FarmerCropModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  farmerId,
  farmId,
  cropToEdit,
}) => {
  const [cropName, setCropName] = useState('');
  const [variety, setVariety] = useState('');
  const [area, setArea] = useState('2.0');
  const [areaUnit, setAreaUnit] = useState('Acres');
  const [sowingDate, setSowingDate] = useState('');
  const [season, setSeason] = useState('Kharif');
  const [irrigationType, setIrrigationType] = useState('Borewell / Canal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cropToEdit) {
      setCropName(cropToEdit.crop_name || '');
      setVariety(cropToEdit.variety || '');
      setArea(cropToEdit.area ? String(cropToEdit.area) : '2.0');
      setAreaUnit(cropToEdit.area_unit || 'Acres');
      setSowingDate(cropToEdit.sowing_date || new Date().toISOString().split('T')[0]);
      setSeason(cropToEdit.season || 'Kharif');
      setIrrigationType(cropToEdit.irrigation_type || 'Borewell / Canal');
    } else {
      setCropName('');
      setVariety('');
      setArea('2.0');
      setAreaUnit('Acres');
      setSowingDate(new Date().toISOString().split('T')[0]);
      setSeason('Kharif');
      setIrrigationType('Borewell / Canal');
    }
    setError(null);
  }, [cropToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropName.trim()) {
      setError('Crop name is required.');
      return;
    }
    if (!farmerId) {
      setError('No active farmer profile. Please register first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (cropToEdit) {
        const res = await updateCrop(cropToEdit.id, {
          crop_name: cropName.trim(),
          variety: variety.trim() || null,
          area: parseFloat(area) || null,
          area_unit: areaUnit,
          sowing_date: sowingDate || null,
          season,
          irrigation_type: irrigationType,
        });

        if (res.success) {
          onSaved({
            ...cropToEdit,
            crop_name: cropName.trim(),
            variety: variety.trim() || null,
            area: parseFloat(area) || null,
            area_unit: areaUnit,
            sowing_date: sowingDate || null,
            season,
            irrigation_type: irrigationType,
          });
          onClose();
        } else {
          setError(res.error || 'Failed to update crop.');
        }
      } else {
        const res = await addCrop({
          farmer_id: farmerId,
          farm_id: farmId,
          crop_name: cropName.trim(),
          variety: variety.trim() || undefined,
          area: parseFloat(area) || undefined,
          area_unit: areaUnit,
          sowing_date: sowingDate || undefined,
          season,
          irrigation_type: irrigationType,
        });

        if (res.success && res.data) {
          onSaved(res.data);
          onClose();
        } else {
          setError(res.error || 'Failed to add crop to Supabase.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Error saving crop.');
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
              🌱
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-foreground">
              {cropToEdit ? 'Edit Crop Details' : 'Add New Crop to My Farm'}
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
              Crop Name *
            </label>
            <input
              type="text"
              required
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              placeholder="e.g. Paddy, Cotton, Chilli"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
            />
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {COMMON_CROP_NAMES.slice(0, 6).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCropName(c)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-secondary hover:bg-primary/20 text-foreground transition-colors"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Variety / Hybrid
              </label>
              <input
                type="text"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder="e.g. BPT 5204 / RCH 659"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Sowing Date
              </label>
              <input
                type="date"
                value={sowingDate}
                onChange={(e) => setSowingDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Crop Area
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Area Unit
              </label>
              <select
                value={areaUnit}
                onChange={(e) => setAreaUnit(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
              >
                <option value="Acres">Acres</option>
                <option value="Hectares">Hectares</option>
                <option value="Guntas">Guntas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Season
              </label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
              >
                <option value="Kharif">Kharif (Monsoon)</option>
                <option value="Rabi">Rabi (Winter)</option>
                <option value="Zaid">Zaid (Summer)</option>
                <option value="Perennial">Perennial / Annual</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Irrigation Type
              </label>
              <select
                value={irrigationType}
                onChange={(e) => setIrrigationType(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
              >
                <option value="Borewell / Canal">Borewell / Canal</option>
                <option value="Drip Irrigation">Drip Irrigation</option>
                <option value="Sprinkler">Sprinkler</option>
                <option value="Rainfed">Rainfed (Dryland)</option>
              </select>
            </div>
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
              {loading ? 'Saving to Supabase...' : cropToEdit ? 'Save Changes' : 'Add Crop to Farm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
