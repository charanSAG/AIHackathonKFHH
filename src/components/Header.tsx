import React, { useState } from 'react';
import { LanguageCode } from '../types';
import { LANGUAGES } from '../data/mockData';

interface HeaderProps {
  currentLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onOpenHelp: () => void;
  onGoBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLanguage,
  onSelectLanguage,
  onOpenHelp,
  onGoBack,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-surface-canvas px-4 py-3 flex items-center justify-between shadow-[0_2px_10px_rgba(28,36,27,0.03)] border-b border-outline-variant/20">
      <div className="flex items-center gap-2">
        <button
          aria-label="Go Back"
          onClick={onGoBack}
          className="w-9 h-9 rounded-full bg-surface-card border border-outline-variant/40 flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 transition-transform"
          type="button"
        >
          <span className="material-symbols-outlined text-lg" data-icon="arrow_back">
            arrow_back
          </span>
        </button>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-xl" data-icon="eco">
              eco
            </span>
            <h1 className="text-[18px] font-bold text-primary tracking-tight leading-none">
              AI Crop Doctor
            </h1>
          </div>
          <p className="text-[12px] text-on-surface-variant leading-none mt-1">
            Plant Disease Diagnosis &amp; Treatment
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 relative">
        {/* Language Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high border border-outline-variant/40 text-on-surface text-[11px] font-semibold active:scale-95 transition-transform"
            type="button"
          >
            <span className="material-symbols-outlined text-sm text-primary" data-icon="translate">
              translate
            </span>
            <span className="uppercase font-bold">{currentLanguage}</span>
            <span className="text-on-surface-variant font-normal">| ते | हि</span>
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-1.5 w-44 bg-surface-card rounded-xl shadow-xl border border-outline-variant/40 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/20">
                Select Language
              </div>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onSelectLanguage(lang.code);
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-surface-container transition-colors ${
                    currentLanguage === lang.code ? 'text-primary font-bold bg-primary/10' : 'text-on-surface'
                  }`}
                >
                  <span>{lang.label}</span>
                  {currentLanguage === lang.code && (
                    <span className="material-symbols-outlined text-xs text-primary" data-icon="check">
                      check
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Help & Guidance Button */}
        <button
          aria-label="Help & Guidance"
          onClick={onOpenHelp}
          className="w-8 h-8 rounded-full bg-surface-card border border-outline-variant/40 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-95"
          type="button"
        >
          <span className="material-symbols-outlined text-lg" data-icon="help_outline">
            help_outline
          </span>
        </button>
      </div>
    </header>
  );
};
