import React, { useState } from 'react';
import { MANDI_RATES } from '../data/mockData';

export const MandiScreen: React.FC = () => {
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('All');

  const filteredRates =
    selectedCropFilter === 'All'
      ? MANDI_RATES
      : MANDI_RATES.filter((r) => r.crop === selectedCropFilter);

  return (
    <div className="pb-24 px-4 pt-3 space-y-4 max-w-lg mx-auto bg-surface-canvas text-on-surface">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-on-surface">Live Mandi Market Rates</h2>
          <p className="text-xs text-on-surface-variant">APMC Market Yard Prices (Warangal Zone)</p>
        </div>
        <span className="flex items-center gap-1 text-[11px] font-bold text-status-healthy px-2 py-0.5 rounded-full bg-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-status-healthy animate-pulse" />
          Live APMC Feed
        </span>
      </div>

      {/* Market Recommendation Banner */}
      <div className="p-3 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 rounded-2xl border border-primary/30 shadow-sm space-y-1">
        <div className="flex items-center gap-1 text-xs font-bold text-primary">
          <span className="material-symbols-outlined text-sm" data-icon="trending_up">
            trending_up
          </span>
          <span>Farmer Market Intelligence Advisory</span>
        </div>
        <p className="text-xs text-on-surface leading-snug">
          Tomato arrivals at <strong>Warangal APMC</strong> dropped 18% today. Modal price gained <strong>₹180/Qtl</strong>.
          Recommended harvest dispatch window is tomorrow 5:00 AM.
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {['All', 'Tomato', 'Chilli', 'Paddy', 'Cotton'].map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedCropFilter(filter)}
            className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-transform active:scale-95 ${
              selectedCropFilter === filter
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-card border border-outline-variant/60 text-on-surface-variant'
            }`}
            type="button"
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Rates Cards */}
      <div className="space-y-3">
        {filteredRates.map((item, idx) => (
          <div
            key={idx}
            className="bg-surface-card rounded-2xl border border-outline-variant/60 p-4 shadow-sm space-y-2.5"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-on-surface">{item.crop}</h3>
                  <span className="text-xs text-on-surface-variant font-medium">({item.variety})</span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-primary" data-icon="storefront">
                    storefront
                  </span>
                  {item.market} • {item.distance}
                </p>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-0.5 ${
                  item.trend === 'up'
                    ? 'bg-emerald-100 text-status-healthy'
                    : 'bg-red-100 text-status-critical'
                }`}
              >
                <span className="material-symbols-outlined text-xs" data-icon={item.trend === 'up' ? 'arrow_upward' : 'arrow_downward'}>
                  {item.trend === 'up' ? 'arrow_upward' : 'arrow_downward'}
                </span>
                {item.change}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1 border-t border-outline-variant/20">
              <div>
                <span className="text-[10px] text-on-surface-variant uppercase font-bold">Modal Rate</span>
                <p className="text-xl font-extrabold text-primary font-mono">
                  ₹{item.modalPrice.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-on-surface-variant">{item.unit}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-on-surface-variant">Today's Inflow</span>
                <p className="text-xs font-bold text-on-surface">{item.arrivalToday}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                className="flex-1 py-1.5 rounded-full bg-surface-container text-primary text-xs font-bold hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-1"
                type="button"
              >
                <span className="material-symbols-outlined text-sm" data-icon="directions">
                  directions
                </span>
                Navigate to Mandi
              </button>
              <button
                className="px-3 py-1.5 rounded-full bg-primary-container text-on-primary text-xs font-bold active:scale-95"
                type="button"
              >
                Set Rate Alert
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
