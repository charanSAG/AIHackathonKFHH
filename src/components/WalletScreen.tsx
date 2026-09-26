import React from 'react';

export const WalletScreen: React.FC = () => {
  return (
    <div className="pb-24 px-4 pt-3 space-y-4 max-w-lg mx-auto bg-surface-canvas text-on-surface">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-on-surface">Farm Wallet &amp; KCC Account</h2>
          <p className="text-xs text-on-surface-variant">Kisan Credit Card • SBI Warangal Branch</p>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-status-healthy text-[11px] font-bold">
          KCC Active
        </span>
      </div>

      {/* Credit Card Digital Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-primary via-emerald-800 to-teal-900 text-white shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-2xl text-accent-mint" data-icon="contactless">
              contactless
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Kisan Credit Card (KCC)
            </span>
          </div>
          <span className="text-xs font-bold text-accent-mint bg-white/10 px-2 py-0.5 rounded-full">
            4.0% Subsidized
          </span>
        </div>

        <div>
          <span className="text-[11px] text-slate-300">Available Input Credit Limit</span>
          <p className="text-2xl font-black tracking-tight font-mono text-white">
            ₹1,37,500 <span className="text-xs font-normal text-slate-300">/ ₹1,80,000</span>
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/20 text-xs text-slate-200">
          <div>
            <span className="text-[10px] text-slate-400">Cardholder</span>
            <p className="font-bold">RAMESH KUMAR B.</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400">Card Number</span>
            <p className="font-mono">•••• 4012</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400">Valid Thru</span>
            <p className="font-mono">08/29</p>
          </div>
        </div>
      </div>

      {/* Direct Subsidy & PM-KISAN Tracker */}
      <div className="bg-surface-card rounded-2xl border border-outline-variant/60 p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl" data-icon="account_balance">
              account_balance
            </span>
            <h3 className="text-sm font-bold text-on-surface">Direct Benefit Transfer (DBT)</h3>
          </div>
          <span className="text-xs font-bold text-status-healthy">Credited</span>
        </div>

        <div className="p-3 rounded-xl bg-surface-canvas border border-outline-variant/30 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-on-surface">PM-KISAN 17th Installment</h4>
            <p className="text-[11px] text-on-surface-variant">Aadhaar verified • Direct to Bank A/C</p>
          </div>
          <span className="text-sm font-bold text-primary font-mono">+₹2,000</span>
        </div>

        <div className="p-3 rounded-xl bg-surface-canvas border border-outline-variant/30 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-on-surface">Rythu Bandhu Kharif Assistance</h4>
            <p className="text-[11px] text-on-surface-variant">Telangana Agri Dept (Direct Benefit Transfer)</p>
          </div>
          <span className="text-sm font-bold text-primary font-mono">+₹44,000</span>
        </div>
      </div>

      {/* Recent Agri-Store Purchases */}
      <div className="bg-surface-card rounded-2xl border border-outline-variant/60 p-4 space-y-3 shadow-sm">
        <h3 className="text-sm font-bold text-on-surface">Recent Input Purchases (Fertilizer &amp; Pesticides)</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded-xl bg-surface-canvas">
            <div>
              <p className="font-bold text-on-surface">Gayatri Krishi Seva Kendra</p>
              <p className="text-[10px] text-on-surface-variant">Mancozeb 500g + Neem Oil 1L</p>
            </div>
            <span className="font-bold text-red-700 font-mono">-₹550</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-surface-canvas">
            <div>
              <p className="font-bold text-on-surface">PACCS Warangal Rural</p>
              <p className="text-[10px] text-on-surface-variant">Subsidized Urea (2 Bags)</p>
            </div>
            <span className="font-bold text-red-700 font-mono">-₹532</span>
          </div>
        </div>
      </div>
    </div>
  );
};
