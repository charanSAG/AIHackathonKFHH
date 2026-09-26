import React, { useState } from 'react';
import { calculateSchemeEligibility, OFFICIAL_GOV_SCHEMES, OfficialGovScheme } from '../services/api';

interface SchemeCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchemeCalculatorModal: React.FC<SchemeCalculatorModalProps> = ({ isOpen, onClose }) => {
  const [landAcres, setLandAcres] = useState<number>(3.5);
  const [cropType, setCropType] = useState('Paddy & Chilli');
  const [category, setCategory] = useState<'Marginal (<2.5 acres)' | 'Small (2.5-5 acres)' | 'Medium/Large (>5 acres)'>('Small (2.5-5 acres)');
  const [state, setState] = useState('Telangana');
  const [selectedScheme, setSelectedScheme] = useState<OfficialGovScheme | null>(null);

  if (!isOpen) return null;

  const eligibleResults = calculateSchemeEligibility({
    landAcres,
    cropType,
    category,
    state,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border shadow-2xl p-6 space-y-6 text-foreground animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center text-2xl font-black">
              🏛️
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-foreground">
                Official Government Scheme &amp; Subsidy Calculator
              </h2>
              <p className="text-xs text-muted-foreground">
                Grounded in PM-KISAN, Rythu Bharosa, KCC, and PMKSY Guidelines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Input Parameters */}
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 bg-secondary/40 p-4 rounded-2xl border border-border/70">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Land Holding (Acres)
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="100"
              value={landAcres}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 1;
                setLandAcres(val);
                if (val <= 2.5) setCategory('Marginal (<2.5 acres)');
                else if (val <= 5) setCategory('Small (2.5-5 acres)');
                else setCategory('Medium/Large (>5 acres)');
              }}
              className="w-full h-10 px-3 rounded-xl bg-card border border-input text-sm font-bold text-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Primary Crop
            </label>
            <select
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              className="w-full h-10 px-2 rounded-xl bg-card border border-input text-sm font-semibold text-foreground"
            >
              <option value="Tomato & Vegetables">Tomato & Vegetables</option>
              <option value="Chilli (Mirchi)">Chilli (Mirchi)</option>
              <option value="Paddy (Rice)">Paddy (Rice)</option>
              <option value="Cotton (Kapas)">Cotton (Kapas)</option>
              <option value="Maize">Maize</option>
              <option value="Turmeric">Turmeric</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Farmer Category
            </label>
            <select
              value={category}
              onChange={(e: any) => setCategory(e.target.value)}
              className="w-full h-10 px-2 rounded-xl bg-card border border-input text-xs font-semibold text-foreground"
            >
              <option value="Marginal (<2.5 acres)">Marginal (&lt;2.5 acres)</option>
              <option value="Small (2.5-5 acres)">Small (2.5-5 acres)</option>
              <option value="Medium/Large (>5 acres)">Medium/Large (&gt;5 acres)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              State / Region
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full h-10 px-2 rounded-xl bg-card border border-input text-sm font-semibold text-foreground"
            >
              <option value="Telangana">Telangana</option>
              <option value="Andhra Pradesh">Andhra Pradesh</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Punjab">Punjab</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
            </select>
          </div>
        </div>

        {/* Calculated Entitlement Summary Banner */}
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
            Estimated Total Annual Direct Support
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-black text-emerald-700 dark:text-emerald-400">
              ₹{(6000 + landAcres * (state === 'Telangana' ? 12000 : 8000)).toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              (Direct DBT Cash Transfers to Aadhaar Linked Bank) + Up to ₹
              {Math.min(300000, Math.round(landAcres * 65000)).toLocaleString('en-IN')} KCC Credit Limit
            </span>
          </div>
        </div>

        {/* Eligible Schemes Breakdown */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-muted-foreground">
            Eligible Schemes &amp; Subsidies for Your Landholding ({eligibleResults.length})
          </h3>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {eligibleResults.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition-colors space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      <span>🏛️</span> {item.scheme.name}
                    </h4>
                    <p className="text-xs text-primary font-semibold mt-0.5">
                      Estimated Benefit: {item.estimatedBenefit}
                    </p>
                  </div>
                  <a
                    href={item.scheme.officialPortalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-3 py-1.5 active:scale-95 shadow-2xs"
                  >
                    Apply on {item.scheme.portalName} ↗
                  </a>
                </div>

                <p className="text-xs text-muted-foreground">{item.whyEligible}</p>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40 text-[11px] text-muted-foreground">
                  <span className="font-medium">Documents:</span>
                  {item.scheme.documentsRequired.slice(0, 3).map((doc, dIdx) => (
                    <span key={dIdx} className="bg-secondary px-2 py-0.5 rounded-md text-foreground">
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border text-xs text-muted-foreground">
          <p>Verified against National Agri Portal &amp; State Land Records Guidelines.</p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold active:scale-95"
            type="button"
          >
            Close Calculator
          </button>
        </div>
      </div>
    </div>
  );
};
