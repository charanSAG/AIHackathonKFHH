import React from 'react';
import { MY_FIELDS } from '../data/mockData';
import { TabType } from '../types';

interface CropsScreenProps {
  onSelectCropToDiagnose: (cropId: string) => void;
  onNavigateTab: (tab: TabType) => void;
}

export const CropsScreen: React.FC<CropsScreenProps> = ({
  onSelectCropToDiagnose,
  onNavigateTab,
}) => {
  return (
    <div className="pb-24 px-4 pt-3 space-y-4 max-w-lg mx-auto bg-surface-canvas text-on-surface">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-on-surface">My Farm Fields &amp; Crops</h2>
          <p className="text-xs text-on-surface-variant">4 registered plots in Warangal Rural</p>
        </div>
        <button
          onClick={() => {
            onSelectCropToDiagnose('tomato');
            onNavigateTab('doctor');
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold active:scale-95 transition-transform"
          type="button"
        >
          <span className="material-symbols-outlined text-sm" data-icon="add">
            add
          </span>
          <span>Add Plot</span>
        </button>
      </div>

      <div className="space-y-3">
        {MY_FIELDS.map((field) => {
          const isWarning = field.healthStatus.includes('Attention');
          const cropId = field.crop.toLowerCase().split(' ')[0];

          return (
            <div
              key={field.id}
              className="bg-surface-card rounded-2xl border border-outline-variant/60 p-4 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-on-surface">{field.crop}</h3>
                    <span className="text-xs text-on-surface-variant">• {field.acreage}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">{field.plot}</p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isWarning
                      ? 'bg-amber-100 text-status-warning'
                      : 'bg-emerald-100 text-status-healthy'
                  }`}
                >
                  {field.healthStatus}
                </span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-on-surface-variant">Health Vitality Score</span>
                  <span className="font-bold text-primary">{field.healthScore}%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isWarning ? 'bg-amber-500' : 'bg-status-healthy'
                    }`}
                    style={{ width: `${field.healthScore}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-surface-canvas p-2.5 rounded-xl border border-outline-variant/30">
                <div>
                  <span className="text-[10px] text-on-surface-variant">Growth Stage</span>
                  <p className="font-semibold text-on-surface">{field.stage}</p>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant">Last AI Scan</span>
                  <p className="font-semibold text-on-surface">{field.lastScanned}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-on-surface-variant italic">
                  Status: {field.diseaseDetected}
                </span>
                <button
                  onClick={() => {
                    onSelectCropToDiagnose(cropId);
                    onNavigateTab('doctor');
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-primary-container text-on-primary text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform hover:bg-primary"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm" data-icon="document_scanner">
                    document_scanner
                  </span>
                  <span>Diagnose Leaf</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
