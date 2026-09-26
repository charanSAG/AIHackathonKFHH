import React, { useState } from 'react';
import { NEARBY_STORE } from '../data/mockData';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({ isOpen, onClose }) => {
  const [reservedItem, setReservedItem] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-outline-variant/30 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-surface-canvas border-b border-outline-variant/30 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-xl" data-icon="storefront">
                storefront
              </span>
              <h3 className="text-sm font-bold text-on-surface">{NEARBY_STORE.name}</h3>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">{NEARBY_STORE.address}</p>
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
        <div className="p-4 overflow-y-auto space-y-4">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
            <span className="text-emerald-900 font-semibold">
              Distance: <strong>{NEARBY_STORE.distance}</strong> (Mandi Road)
            </span>
            <span className="text-status-healthy font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-status-healthy animate-pulse" />
              Open till 8:00 PM
            </span>
          </div>

          <div>
            <h4 className="text-xs font-bold text-on-surface mb-2">Available Diagnostic Medicines in Stock:</h4>
            <div className="space-y-2">
              {NEARBY_STORE.medicines.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-outline-variant/40 bg-surface-canvas flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-on-surface">{m.name}</p>
                    <span className="text-[11px] text-on-surface-variant">Pack: {m.packSize}</span>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="text-sm font-bold text-primary font-mono">₹{m.price}</span>
                    <button
                      onClick={() => setReservedItem(m.name)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95 ${
                        reservedItem === m.name
                          ? 'bg-emerald-600 text-white'
                          : 'bg-primary-container text-white hover:bg-primary'
                      }`}
                      type="button"
                    >
                      {reservedItem === m.name ? 'Reserved ✓' : 'Hold Stock'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {reservedItem && (
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-medium border border-emerald-300 animate-in fade-in">
              Order hold request sent to storekeeper! Reference token <strong>#GK-442</strong> reserved for 4 hours.
            </div>
          )}
        </div>

        {/* Footer CTAs */}
        <div className="p-3.5 bg-surface-canvas border-t border-outline-variant/20 flex items-center gap-2">
          <a
            href={`tel:${NEARBY_STORE.phone}`}
            className="flex-1 py-2.5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 shadow-md"
          >
            <span className="material-symbols-outlined text-base" data-icon="call">
              call
            </span>
            Call Storekeeper
          </a>
          <button
            onClick={() => {
              window.open(`https://maps.google.com/?q=${encodeURIComponent(NEARBY_STORE.address)}`, '_blank');
            }}
            className="px-4 py-2.5 rounded-full bg-surface-card border border-outline-variant text-on-surface text-xs font-bold flex items-center justify-center gap-1 hover:border-primary active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-base" data-icon="directions">
              directions
            </span>
            Google Maps
          </button>
        </div>
      </div>
    </div>
  );
};
