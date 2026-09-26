import React from 'react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'crops', label: 'Crops', icon: 'psychiatry' },
    { id: 'doctor', label: 'Doctor', icon: 'document_scanner' },
    { id: 'mandi', label: 'Mandi', icon: 'storefront' },
    { id: 'wallet', label: 'Wallet', icon: 'account_balance_wallet' },
  ];

  return (
    <nav
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 w-full z-30 flex justify-around items-center px-2 py-1.5 max-w-lg mx-auto bg-surface-card rounded-t-xl border-t border-outline-variant/30 shadow-[0_-4px_16px_-2px_rgba(28,36,27,0.06)]"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center justify-center py-1 px-3 transition-colors active:scale-95 duration-150 relative ${
              isActive ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
            }`}
            type="button"
          >
            <span
              className="material-symbols-outlined text-2xl"
              data-icon={tab.icon}
              style={{
                fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              {tab.icon}
            </span>
            <span className="text-[11px] font-medium mt-0.5 tracking-tight">{tab.label}</span>
            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary absolute -bottom-0.5" />}
          </button>
        );
      })}
    </nav>
  );
};
