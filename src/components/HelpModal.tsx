import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-outline-variant/30 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-surface-canvas border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl" data-icon="help_outline">
              help_outline
            </span>
            <h3 className="text-sm font-bold text-on-surface">How to Use AI Crop Doctor</h3>
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

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          <div className="p-3 rounded-2xl bg-emerald-50 border border-primary/20 space-y-1">
            <h4 className="font-bold text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-base" data-icon="photo_camera">
                photo_camera
              </span>
              1. Capturing Sharp Leaf Photos
            </h4>
            <p className="text-on-surface-variant leading-relaxed">
              Hold the camera 15-20 cm away from the infected leaf. Ensure the leaf fills the screen under natural daylight without heavy shadows or motion blur.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
            <h4 className="font-bold text-amber-900 flex items-center gap-1">
              <span className="material-symbols-outlined text-base" data-icon="mic">
                mic
              </span>
              2. Asking Questions via Voice
            </h4>
            <p className="text-on-surface-variant leading-relaxed">
              Tap the large microphone button in the voice assistant. Speak naturally in Telugu, Hindi, Tamil, Kannada, or Marathi. Ask questions about spray timings, tank dosage, or rain forecasts.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
            <h4 className="font-bold text-blue-900 flex items-center gap-1">
              <span className="material-symbols-outlined text-base" data-icon="volume_up">
                volume_up
              </span>
              3. Hands-Free Audio Guides
            </h4>
            <p className="text-on-surface-variant leading-relaxed">
              Farmers working in the field can listen to complete diagnostic and spray instructions in their regional mother tongue with variable audio speed (1.0x, 1.25x, 1.5x).
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-surface-canvas border border-outline-variant/30 space-y-1">
            <h4 className="font-bold text-on-surface flex items-center gap-1">
              <span className="material-symbols-outlined text-base text-primary" data-icon="verified">
                verified
              </span>
              4. Verified Agronomist Review
            </h4>
            <p className="text-on-surface-variant leading-relaxed">
              If severe blight or pest spread is detected, connect with KVK Agronomists directly through the free in-app chat or phone consultation.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-surface-canvas border-t border-outline-variant/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-primary text-white text-xs font-bold active:scale-95"
            type="button"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
