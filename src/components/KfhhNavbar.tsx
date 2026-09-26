import React, { useState } from 'react';
import { Language, getT, NOTIFICATIONS_DATA } from '../data/kfhhData';
import { FarmerProfile } from '../services/farmerService';

interface KfhhNavbarProps {
  lang: Language;
  setLang: (l: Language) => void;
  onNavigate: (sectionId: string) => void;
  onOpenSupabase?: () => void;
  farmerProfile?: FarmerProfile | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
}

export const KfhhNavbar: React.FC<KfhhNavbarProps> = ({
  lang,
  setLang,
  onNavigate,
  onOpenSupabase,
  farmerProfile,
  onOpenAuth,
  onLogout,
}) => {
  const t = getT(lang);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readAll, setReadAll] = useState(false);
  const unreadCount = readAll ? 0 : NOTIFICATIONS_DATA.filter((n) => n.unread).length;

  const navItems: { id: string; label: string }[] = [
    { id: 'home', label: t('home') },
    { id: 'my-farm', label: 'My Farm' },
    { id: 'markets', label: t('markets') },
    { id: 'schemes', label: t('schemes') },
    { id: 'community', label: t('community') },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        {/* Brand / Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-left"
          aria-label="KFHH home"
          type="button"
        >
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-sprout size-5"
              aria-hidden="true"
            >
              <path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3" />
              <path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4" />
              <path d="M5 21h14" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-extrabold tracking-tight text-foreground">KFHH</span>
            <span className="hidden text-[11px] font-medium text-muted-foreground sm:block">
              Kisan Future Helping Hand
            </span>
          </span>
        </button>

        {/* Center Navigation Links */}
        <nav className="mx-auto hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="ml-auto flex items-center gap-2 relative">
          {/* Farmer Profile / Auth Status */}
          {farmerProfile ? (
            <div className="flex items-center gap-1.5 bg-card border border-border/80 rounded-full pl-2 pr-1 py-1 shadow-2xs">
              <button
                type="button"
                onClick={() => onNavigate('my-farm')}
                className="flex items-center gap-1.5 text-xs font-bold text-foreground hover:text-primary transition-colors"
                title="View My Farm & Profile"
              >
                <span className="size-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs">
                  👨‍🌾
                </span>
                <span className="max-w-[110px] truncate hidden sm:inline">{farmerProfile.full_name}</span>
              </button>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Sign out of farm"
                >
                  Logout
                </button>
              )}
            </div>
          ) : (
            onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs active:scale-95"
              >
                <span>👨‍🌾</span>
                <span>Register / Login</span>
              </button>
            )
          )}

          {/* Supabase Cloud Connection Button */}
          {onOpenSupabase && (
            <button
              onClick={onOpenSupabase}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold transition-all active:scale-95"
              title="Supabase Cloud Database & Sync"
              type="button"
            >
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Supabase</span>
            </button>
          )}

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors hover:bg-secondary h-9 w-9 relative rounded-full text-foreground"
              aria-label={t('notifications')}
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 size-2.5 rounded-full bg-accent ring-2 ring-background" />
              )}
            </button>

            {/* Notification Drawer Modal */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-card border border-border shadow-2xl p-4 z-50 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="font-bold text-foreground">{t('notifications')}</h3>
                    <p className="text-xs text-muted-foreground">Smart alerts for your farm</p>
                  </div>
                  <button
                    onClick={() => setReadAll(true)}
                    className="text-xs text-primary font-bold hover:underline"
                    type="button"
                  >
                    Mark read
                  </button>
                </div>
                <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {NOTIFICATIONS_DATA.map((n, i) => (
                    <div
                      key={i}
                      className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs"
                    >
                      <span className="text-2xl">{n.icon}</span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                          {n.title}
                          {n.unread && !readAll && (
                            <span className="size-2 rounded-full bg-accent inline-block" />
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <div className="flex items-center rounded-full bg-secondary p-1 text-xs font-bold">
            {(['en', 'hi', 'te'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`rounded-full px-2.5 py-1 uppercase transition-colors ${
                  lang === l
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                type="button"
              >
                {l === 'en' ? 'EN' : l === 'hi' ? 'हि' : 'తె'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
