import React, { useState } from 'react';
import { CROP_DISEASES } from '../data/mockData';

interface CameraScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCrop: (cropId: string) => void;
}

export const CameraScanModal: React.FC<CameraScanModalProps> = ({
  isOpen,
  onClose,
  onSelectCrop,
}) => {
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomPhotoUrl(url);
      setIsScanning(true);
      setTimeout(() => {
        setIsScanning(false);
        onSelectCrop('tomato');
        onClose();
      }, 1500);
    }
  };

  const handlePickSample = (cropId: string) => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      onSelectCrop(cropId);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-outline-variant/30 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl" data-icon="photo_camera">
              photo_camera
            </span>
            <h3 className="text-sm font-bold text-on-surface">AI Crop Leaf Scanner</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-on-surface-variant hover:bg-slate-200 active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-base" data-icon="close">
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Upload or Camera Capture Box */}
          <label className="relative border-2 border-dashed border-primary/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-surface-canvas hover:border-primary cursor-pointer transition-colors">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-3xl" data-icon="add_a_photo">
                add_a_photo
              </span>
            </div>
            <p className="text-xs font-bold text-primary">Tap to Take Leaf Photo or Upload</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Focus on single infected leaf under daylight
            </p>
          </label>

          {isScanning && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-primary/30 flex flex-col items-center justify-center gap-2">
              <span className="w-8 h-8 rounded-full border-3 border-primary border-t-transparent animate-spin" />
              <p className="text-xs font-bold text-primary">AI Neural Model scanning leaf lesions &amp; spores...</p>
            </div>
          )}

          {/* Sample Diagnostic Crops to Test */}
          <div>
            <p className="text-xs font-bold text-on-surface mb-2">Or select from field test samples:</p>
            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(CROP_DISEASES).map(([key, crop]) => (
                <button
                  key={key}
                  onClick={() => handlePickSample(key)}
                  className="p-2.5 rounded-xl border border-outline-variant/40 bg-white hover:border-primary text-left flex items-center gap-2.5 active:scale-95 transition-all shadow-sm"
                  type="button"
                >
                  <img
                    src={crop.imageUrl}
                    alt={crop.cropName}
                    className="w-11 h-11 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-on-surface truncate">{crop.cropName}</p>
                    <p className="text-[10px] text-status-warning font-semibold truncate">
                      {crop.diseaseName}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-surface-canvas border-t border-outline-variant/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-slate-200 text-on-surface text-xs font-bold active:scale-95"
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
