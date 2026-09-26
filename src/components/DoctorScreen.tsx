import React, { useState, useEffect } from 'react';
import { CropDisease, LanguageCode } from '../types';
import { CROP_DISEASES, LANGUAGES, NEARBY_STORE, AGRONOMIST_PROFILE } from '../data/mockData';

interface DoctorScreenProps {
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onOpenVoiceModal: (initialQuery?: string) => void;
  onOpenScanModal: () => void;
  onOpenChatModal: () => void;
  onOpenStoreModal: () => void;
}

export const DoctorScreen: React.FC<DoctorScreenProps> = ({
  currentLanguage,
  onLanguageChange,
  onOpenVoiceModal,
  onOpenScanModal,
  onOpenChatModal,
  onOpenStoreModal,
}) => {
  const [selectedCropId, setSelectedCropId] = useState<string>('tomato');
  const cropData: CropDisease = CROP_DISEASES[selectedCropId] || CROP_DISEASES.tomato;

  // Audio guide state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(47); // 47% like in screenshot (0:42 / 1:30)
  const [audioSpeed, setAudioSpeed] = useState<'1.0x' | '1.25x' | '1.5x' | '0.75x'>('1.0x');
  const [savedToLogToast, setSavedToLogToast] = useState(false);
  const [whatsappToast, setWhatsappToast] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);

  // Audio guide playback simulation / speech
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingAudio) {
      timer = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 1;
        });
      }, 900);
    }
    return () => clearInterval(timer);
  }, [isPlayingAudio]);

  const toggleAudioGuide = () => {
    if (isPlayingAudio) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      if ('speechSynthesis' in window) {
        const text =
          cropData.audioGuide.narrationText[currentLanguage] ||
          cropData.audioGuide.narrationText.en;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = audioSpeed === '1.25x' ? 1.25 : audioSpeed === '1.5x' ? 1.5 : 1.0;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const cycleSpeed = () => {
    const speeds: ('1.0x' | '1.25x' | '1.5x' | '0.75x')[] = ['1.0x', '1.25x', '1.5x', '0.75x'];
    const nextIdx = (speeds.indexOf(audioSpeed) + 1) % speeds.length;
    setAudioSpeed(speeds[nextIdx]);
  };

  const handleReplay10 = () => {
    setAudioProgress((prev) => Math.max(0, prev - 11));
  };

  const handleSaveToLog = () => {
    setSavedToLogToast(true);
    setTimeout(() => setSavedToLogToast(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const text = `*AI Crop Doctor Diagnosis*\nCrop: ${cropData.cropName} (${cropData.diseaseName})\nSeverity: ${cropData.severity} (${cropData.confidence}% Confidence)\nRecommended Chemical: ${cropData.treatment.chemical.name} (${cropData.treatment.chemical.dosage})\nOrganic: ${cropData.treatment.organic.name}`;
    navigator.clipboard?.writeText(text);
    setWhatsappToast(true);
    setTimeout(() => setWhatsappToast(false), 3000);
  };

  // Convert progress % to minutes:seconds (total 90s)
  const currentSeconds = Math.floor((audioProgress / 100) * cropData.audioGuide.durationSeconds);
  const minutes = Math.floor(currentSeconds / 60);
  const seconds = currentSeconds % 60;
  const timeDisplay = `${minutes}:${String(seconds).padStart(2, '0')} / 1:30`;

  return (
    <div className="pb-36 bg-surface-canvas text-on-surface">
      {/* Crop Selector Horizontal Ribbon */}
      <div className="px-4 pt-2 pb-1 overflow-x-auto no-scrollbar flex items-center gap-2">
        <button
          onClick={() => setSelectedCropId('tomato')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-transform active:scale-95 ${
            selectedCropId === 'tomato'
              ? 'bg-primary-container text-on-primary shadow-sm'
              : 'bg-surface-card border border-outline-variant/60 text-on-surface-variant'
          }`}
          type="button"
        >
          {selectedCropId === 'tomato' && (
            <span
              className="material-symbols-outlined text-base"
              data-icon="check_circle"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          )}
          <span>Tomato (Solanaceae)</span>
        </button>

        <button
          onClick={() => setSelectedCropId('chilli')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-transform active:scale-95 ${
            selectedCropId === 'chilli'
              ? 'bg-primary-container text-on-primary shadow-sm'
              : 'bg-surface-card border border-outline-variant/60 text-on-surface-variant'
          }`}
          type="button"
        >
          {selectedCropId === 'chilli' && (
            <span
              className="material-symbols-outlined text-base"
              data-icon="check_circle"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          )}
          <span>Chilli</span>
        </button>

        <button
          onClick={() => setSelectedCropId('paddy')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-transform active:scale-95 ${
            selectedCropId === 'paddy'
              ? 'bg-primary-container text-on-primary shadow-sm'
              : 'bg-surface-card border border-outline-variant/60 text-on-surface-variant'
          }`}
          type="button"
        >
          {selectedCropId === 'paddy' && (
            <span
              className="material-symbols-outlined text-base"
              data-icon="check_circle"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          )}
          <span>Paddy</span>
        </button>

        <button
          onClick={() => setSelectedCropId('cotton')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-transform active:scale-95 ${
            selectedCropId === 'cotton'
              ? 'bg-primary-container text-on-primary shadow-sm'
              : 'bg-surface-card border border-outline-variant/60 text-on-surface-variant'
          }`}
          type="button"
        >
          {selectedCropId === 'cotton' && (
            <span
              className="material-symbols-outlined text-base"
              data-icon="check_circle"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          )}
          <span>Cotton</span>
        </button>

        <button
          onClick={onOpenScanModal}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-container-high text-primary text-xs font-semibold shrink-0 border border-dashed border-primary/40 active:scale-95 transition-transform"
          type="button"
        >
          <span className="material-symbols-outlined text-sm" data-icon="add">
            add
          </span>
          <span>Other</span>
        </button>
      </div>

      {/* Audio Guide Card */}
      <section
        aria-label="Audio Guide"
        className="mx-4 mt-3 p-3 bg-gradient-to-br from-surface-card via-surface-card to-surface-container-high/60 rounded-2xl border border-primary/30 shadow-[0_4px_16px_-2px_rgba(28,36,27,0.06)]"
      >
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-outline-variant/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary-container/50 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-lg" data-icon="volume_up">
                volume_up
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-on-surface">Listen in Regional Language</span>
                <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  ऑडियो सुनें
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">Hands-free audio guide for diagnosis &amp; treatment</p>
            </div>
          </div>
          <button
            aria-label="Speed control"
            onClick={cycleSpeed}
            className="px-2 py-0.5 rounded-full bg-surface-canvas border border-outline-variant/50 text-[11px] font-bold text-on-surface-variant hover:text-primary active:scale-95 transition-transform"
            type="button"
          >
            {audioSpeed}
          </button>
        </div>

        {/* Regional Language Selection Chips */}
        <div className="pt-2 pb-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {LANGUAGES.map((lang) => {
            const isSelected = currentLanguage === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 flex items-center gap-1 transition-transform active:scale-95 ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-canvas border border-outline-variant/50 text-on-surface'
                }`}
                type="button"
              >
                {isSelected && (
                  <span className="material-symbols-outlined text-xs" data-icon="check">
                    check
                  </span>
                )}
                <span>{lang.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Audio Player Bar */}
        <div className="p-2.5 rounded-xl bg-surface-container/70 border border-outline-variant/40 flex items-center gap-2.5">
          <button
            aria-label="Play / Pause audio narration"
            onClick={toggleAudioGuide}
            className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-transform hover:bg-primary"
            type="button"
          >
            <span className="material-symbols-outlined text-xl" data-icon={isPlayingAudio ? 'pause' : 'play_arrow'}>
              {isPlayingAudio ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-semibold text-primary truncate">
                {cropData.audioGuide.title}
              </span>
              <span className="text-on-surface-variant font-medium ml-1 shrink-0 font-mono">
                {timeDisplay}
              </span>
            </div>
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const newPct = Math.round((clickX / rect.width) * 100);
                setAudioProgress(Math.max(0, Math.min(100, newPct)));
              }}
              className="w-full bg-surface-card rounded-full h-2 relative overflow-hidden border border-outline-variant/30 cursor-pointer"
            >
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${audioProgress}%` }}
              />
            </div>
          </div>
          <button
            aria-label="Replay 10 seconds"
            onClick={handleReplay10}
            className="w-8 h-8 rounded-full bg-surface-card text-on-surface-variant flex items-center justify-center shrink-0 border border-outline-variant/40 active:scale-95 transition-transform"
            type="button"
          >
            <span className="material-symbols-outlined text-base" data-icon="replay_10">
              replay_10
            </span>
          </button>
        </div>
      </section>

      {/* Ask Doctor AI Voice Assistant Card */}
      <section
        aria-label="Ask Doctor AI Voice Assistant"
        className="mx-4 mt-3 p-3.5 bg-gradient-to-br from-surface-card via-surface-card to-secondary-container/20 rounded-2xl border-2 border-primary/40 shadow-[0_4px_16px_-2px_rgba(28,36,27,0.08)] relative overflow-hidden"
      >
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-outline-variant/30">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-xl" data-icon="mic">
                mic
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm font-bold text-on-surface">Ask Doctor AI</h2>
                <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  बोलकर पूछें / మాట్లాడి అడగండి
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">Instant voice answers in your local dialect</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-bold text-status-healthy px-2 py-0.5 rounded-full bg-emerald-100">
            <span className="w-2 h-2 rounded-full bg-status-healthy animate-pulse" />
            Online
          </span>
        </div>

        <div className="mt-3 p-3 rounded-xl bg-surface-canvas/90 border border-primary/20 flex flex-col items-center text-center gap-2.5 relative">
          <div className="relative flex items-center justify-center my-1">
            <div className="absolute w-16 h-16 rounded-full bg-accent-mint/30 animate-pulse" />
            <button
              aria-label="Tap to speak your question"
              onClick={() => onOpenVoiceModal()}
              className="relative w-14 h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-lg active:scale-95 transition-transform border-2 border-accent-mint hover:bg-primary"
              type="button"
            >
              <span className="material-symbols-outlined text-2xl" data-icon="mic">
                mic
              </span>
            </button>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-primary">Tap mic &amp; ask any question about this crop</p>
            <p className="text-xs text-on-surface-variant italic">
              "Can I spray before rain?" or "How much water per tank?"
            </p>
          </div>
          <div className="flex items-center justify-center gap-1 text-primary py-0.5">
            <span className="w-1 h-3 rounded-full bg-primary animate-pulse" />
            <span className="w-1 h-5 rounded-full bg-primary animate-pulse" />
            <span className="w-1 h-2 rounded-full bg-primary animate-pulse" />
            <span className="w-1 h-6 rounded-full bg-primary animate-pulse" />
            <span className="w-1 h-4 rounded-full bg-primary animate-pulse" />
            <span className="w-1 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] text-on-surface-variant ml-1 font-semibold">Listening Mode Ready</span>
          </div>
        </div>

        <div className="mt-2.5">
          <p className="text-[11px] font-bold text-on-surface-variant mb-1.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs text-primary" data-icon="tips_and_updates">
              tips_and_updates
            </span>
            Suggested Quick Farmer Questions (बोलने के लिए टैप करें):
          </p>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <button
              onClick={() =>
                onOpenVoiceModal('ఈ మందుతో పాటు పురుగు మందును కూడా కలిపి కొట్టవచ్చా? (Can I mix with insecticide?)')
              }
              className="px-2.5 py-1 rounded-full bg-surface-canvas border border-outline-variant/50 text-on-surface text-[11px] shrink-0 flex items-center gap-1 hover:border-primary active:scale-95 transition-transform"
              type="button"
            >
              <span className="material-symbols-outlined text-xs text-primary" data-icon="graphic_eq">
                graphic_eq
              </span>
              <span>Can I mix with insecticide?</span>
            </button>
            <button
              onClick={() =>
                onOpenVoiceModal(
                  'ఈ ఆకుమచ్చ తెగులు పక్కన ఉన్న చేనుకు కూడా వ్యాపిస్తుందా? (Is this contagious to next row?)'
                )
              }
              className="px-2.5 py-1 rounded-full bg-surface-canvas border border-outline-variant/50 text-on-surface text-[11px] shrink-0 flex items-center gap-1 hover:border-primary active:scale-95 transition-transform"
              type="button"
            >
              <span className="material-symbols-outlined text-xs text-primary" data-icon="graphic_eq">
                graphic_eq
              </span>
              <span>Is this contagious to next row?</span>
            </button>
            <button
              onClick={() =>
                onOpenVoiceModal('ఈ రోజు మందు పిచికారీ చేయడానికి సరైన సమయం ఏది? (What is best spray time today?)')
              }
              className="px-2.5 py-1 rounded-full bg-surface-canvas border border-outline-variant/50 text-on-surface text-[11px] shrink-0 flex items-center gap-1 hover:border-primary active:scale-95 transition-transform"
              type="button"
            >
              <span className="material-symbols-outlined text-xs text-primary" data-icon="graphic_eq">
                graphic_eq
              </span>
              <span>What is best spray time today?</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Diagnostic Flow */}
      <main className="px-4 space-y-4 pt-3">
        {/* Viewfinder / Inspected Leaf Card */}
        <section className="bg-surface-card rounded-2xl border border-outline-variant/50 p-2 shadow-[0_4px_16px_-2px_rgba(28,36,27,0.05)] overflow-hidden">
          <div className="relative w-full h-56 rounded-xl overflow-hidden bg-[#2a3329]">
            <img
              className="w-full h-full object-cover opacity-90"
              alt={cropData.altText}
              src={cropData.imageUrl}
            />
            {/* Live AI Diagnostic Scanner Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            {/* Bounding Box Detection UI */}
            <div className="absolute top-1/4 left-1/3 w-32 h-24 border-2 border-accent-mint rounded-lg pointer-events-none">
              <span className="absolute -top-3 left-2 bg-primary px-2 py-0.5 rounded-full text-[10px] text-on-primary font-bold tracking-wider flex items-center gap-1 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-mint animate-pulse" />
                {cropData.confidence}% Match
              </span>
              <div className="absolute inset-0 bg-accent-mint/10 backdrop-blur-[0.5px]" />
              {/* Crosshair corners */}
              <span className="absolute -bottom-1 -right-1 w-2 h-2 border-r-2 border-b-2 border-accent-mint" />
              <span className="absolute -top-1 -right-1 w-2 h-2 border-r-2 border-t-2 border-accent-mint" />
            </div>

            {/* Target Tag Floating Overlay */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-on-primary">
              <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                <span className="material-symbols-outlined text-accent-mint text-sm" data-icon="center_focus_strong">
                  center_focus_strong
                </span>
                <span className="text-[11px] font-semibold text-on-primary">
                  Target: {cropData.targetSpot}
                </span>
              </div>
              <span className="text-[11px] bg-black/60 px-2 py-1 rounded-full">
                Scanned {cropData.scanTime}
              </span>
            </div>
          </div>

          {/* Quick Viewfinder Control Bar */}
          <div className="flex items-center justify-between pt-2.5 px-1">
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenScanModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container text-on-surface text-xs font-semibold active:scale-95 transition-transform"
                type="button"
              >
                <span className="material-symbols-outlined text-base" data-icon="photo_camera">
                  photo_camera
                </span>
                <span>Retake Photo</span>
              </button>
              <button
                onClick={onOpenScanModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-canvas border border-outline-variant/60 text-on-surface-variant text-xs font-semibold active:scale-95 transition-transform"
                type="button"
              >
                <span className="material-symbols-outlined text-base" data-icon="swap_horiz">
                  swap_horiz
                </span>
                <span>Switch Crop</span>
              </button>
            </div>
            <button
              aria-label="Zoom Leaf"
              onClick={() => setIsZoomModalOpen(true)}
              className="w-8 h-8 rounded-full bg-surface-canvas flex items-center justify-center text-on-surface-variant hover:text-primary active:scale-95"
              type="button"
            >
              <span className="material-symbols-outlined text-lg" data-icon="zoom_in">
                zoom_in
              </span>
            </button>
          </div>
        </section>

        {/* AI Diagnostic Summary Card (Primary Highlight) */}
        <section className="bg-surface-card rounded-2xl border border-outline-variant/60 p-4 shadow-[0_4px_16px_-2px_rgba(28,36,27,0.06)] relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-status-warning" />
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-status-warning border border-status-warning/30 text-[11px] font-bold">
                  <span
                    className="material-symbols-outlined text-xs"
                    data-icon="warning"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    warning
                  </span>
                  Severity: {cropData.severity} ({cropData.severityLevel})
                </span>
                <span className="text-xs text-status-healthy font-semibold">
                  {cropData.confidence}% Confidence
                </span>
              </div>
              <h2 className="text-xl font-bold text-on-surface mt-1.5">
                {cropData.diseaseName}
              </h2>
              <p className="text-xs italic text-on-surface-variant">
                {cropData.scientificName}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center text-amber-800 shrink-0">
              <span className="material-symbols-outlined text-2xl" data-icon="psychiatry">
                psychiatry
              </span>
            </div>
          </div>

          {/* Symptoms Checklist Pills */}
          <div className="mt-3 pt-3 border-t border-outline-variant/30 space-y-2">
            <h3 className="text-xs font-bold text-on-surface flex items-center gap-1">
              <span className="material-symbols-outlined text-primary text-base" data-icon="troubleshoot">
                troubleshoot
              </span>
              Detected Symptoms on Foliage:
            </h3>
            <div className="grid grid-cols-1 gap-1.5 text-xs text-on-surface-variant">
              {cropData.symptoms.map((symptom, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-surface-canvas/70 px-2.5 py-1.5 rounded-lg border border-outline-variant/30"
                >
                  <span className="material-symbols-outlined text-primary text-sm shrink-0" data-icon="radio_button_checked">
                    radio_button_checked
                  </span>
                  <span>{symptom}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Metric Bar */}
          <div className="mt-4 p-2.5 rounded-xl bg-red-50 border border-red-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-status-critical text-xl" data-icon="trending_down">
                trending_down
              </span>
              <div>
                <p className="text-[10px] font-bold text-status-critical uppercase tracking-wide">
                  Yield Risk Forecast
                </p>
                <p className="text-xs font-bold text-red-950">
                  {cropData.yieldRiskForecast}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-status-critical text-white text-[11px] font-bold animate-pulse">
              Action Due
            </span>
          </div>
        </section>

        {/* Section: Treatment Plan (Organic vs Chemical) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-xl" data-icon="medical_services">
                medical_services
              </span>
              <h3 className="text-base font-bold text-on-surface">Recommended Treatment Plan</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleAudioGuide}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container/50 border border-primary/30 text-on-secondary-container text-[11px] font-bold active:scale-95 transition-transform shadow-sm"
                type="button"
              >
                <span className="material-symbols-outlined text-base text-primary" data-icon="spatial_audio_off">
                  spatial_audio_off
                </span>
                <span>Listen Spray Guide (స్ప్రే నిర్దేశాలు)</span>
              </button>
            </div>
          </div>

          {/* Organic Option Card */}
          <div className="bg-surface-card rounded-2xl border border-outline-variant/60 p-4 space-y-3 shadow-[0_4px_16px_-2px_rgba(28,36,27,0.03)]">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-status-healthy text-[11px] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm" data-icon="nature">
                  nature
                </span>
                Organic / Bio Solution (Safe for Soil)
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium">Cost: {cropData.treatment.organic.cost}</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-on-surface">
                {cropData.treatment.organic.name}
              </h4>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {cropData.treatment.organic.description}
              </p>
            </div>
            <div className="bg-surface-canvas rounded-xl p-3 space-y-2 border border-outline-variant/30">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-xs text-on-surface">
                  <strong className="font-bold">Dosage:</strong> {cropData.treatment.organic.steps.dosage}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-xs text-on-surface">
                  <strong className="font-bold">Application Time:</strong>{' '}
                  {cropData.treatment.organic.steps.applicationTime}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-xs text-on-surface">
                  <strong className="font-bold">Repeat Interval:</strong>{' '}
                  {cropData.treatment.organic.steps.repeatInterval}
                </p>
              </div>
            </div>
          </div>

          {/* Chemical Fast Action Card */}
          <div className="bg-surface-card rounded-2xl border border-outline-variant/60 p-4 space-y-3 shadow-[0_4px_16px_-2px_rgba(28,36,27,0.03)]">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm" data-icon="science">
                  science
                </span>
                Rapid Control (Chemical Fungicide)
              </span>
              <span className="text-[11px] text-status-warning font-bold">
                {cropData.treatment.chemical.actionTag}
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-on-surface">
                {cropData.treatment.chemical.name}
              </h4>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {cropData.treatment.chemical.description}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-surface-canvas p-2.5 rounded-xl border border-outline-variant/40">
                <p className="text-[11px] text-on-surface-variant">Recommended Dosage</p>
                <p className="text-lg font-bold text-primary">
                  {cropData.treatment.chemical.dosage}
                </p>
                <p className="text-[10px] text-on-surface-variant">
                  {cropData.treatment.chemical.dosagePerAcre}
                </p>
              </div>
              <div className="bg-surface-canvas p-2.5 rounded-xl border border-outline-variant/40">
                <p className="text-[11px] text-on-surface-variant">Pre-Harvest Interval (PHI)</p>
                <p className="text-lg font-bold text-tertiary-container">
                  {cropData.treatment.chemical.phiDays} Days
                </p>
                <p className="text-[10px] text-on-surface-variant">No plucking before</p>
              </div>
            </div>
            {/* Safety Callout */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-high text-on-surface text-xs">
              <span className="material-symbols-outlined text-on-surface-variant text-lg shrink-0" data-icon="health_and_safety">
                health_and_safety
              </span>
              <span>{cropData.treatment.chemical.safetyWarning}</span>
            </div>
          </div>
        </section>

        {/* Section: Preventive Measures & Cultural Practices */}
        <section className="bg-surface-card rounded-2xl border border-outline-variant/60 p-4 space-y-3">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-xl" data-icon="shield">
              shield
            </span>
            <h3 className="text-base font-bold text-on-surface">Preventive Field Management</h3>
          </div>
          <div className="space-y-2 text-xs">
            {cropData.preventiveMeasures.map((measure, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2 rounded-xl bg-surface-canvas">
                <span className="material-symbols-outlined text-primary text-lg mt-0.5 shrink-0" data-icon={measure.icon}>
                  {measure.icon}
                </span>
                <div>
                  <strong className="font-bold text-on-surface">{measure.title}: </strong>
                  <span className="text-on-surface-variant">{measure.description}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Nearest Agri-Store & Medicine Availability */}
        <section className="bg-surface-card rounded-2xl border border-outline-variant/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-xl" data-icon="storefront">
                storefront
              </span>
              <h3 className="text-base font-bold text-on-surface">Nearby Agri-Store Stock</h3>
            </div>
            <span className="text-xs text-status-healthy font-semibold">
              {NEARBY_STORE.distance}
            </span>
          </div>
          <div className="p-3 rounded-xl border border-outline-variant/40 bg-surface-canvas space-y-2.5">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-on-surface">
                  {NEARBY_STORE.name}
                </h4>
                <p className="text-xs text-on-surface-variant">
                  {NEARBY_STORE.address}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-status-healthy text-[11px] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs" data-icon="inventory_2">
                  inventory_2
                </span>
                In Stock
              </span>
            </div>
            <div className="text-xs text-on-surface-variant flex flex-wrap gap-2">
              {NEARBY_STORE.medicines.slice(0, 2).map((m, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-surface-card rounded border border-outline-variant/30">
                  {m.name.split(' ')[0]} {m.packSize}: ₹{m.price}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={onOpenStoreModal}
                className="flex-1 py-2 rounded-full bg-primary-container text-on-primary text-center text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform hover:bg-primary"
                type="button"
              >
                <span className="material-symbols-outlined text-base" data-icon="call">
                  call
                </span>
                Call &amp; Hold Order
              </button>
              <button
                onClick={onOpenStoreModal}
                className="px-3.5 py-2 rounded-full bg-surface-card border border-outline-variant text-on-surface text-xs font-semibold flex items-center justify-center gap-1 hover:border-primary active:scale-95"
                type="button"
              >
                <span className="material-symbols-outlined text-base" data-icon="directions">
                  directions
                </span>
                Map
              </button>
            </div>
          </div>
        </section>

        {/* Section: Verified Agri-Expert Second Opinion */}
        <section className="bg-gradient-to-br from-surface-card to-surface-container-low rounded-2xl border border-outline-variant/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-xl" data-icon="support_agent">
                support_agent
              </span>
              <h3 className="text-base font-bold text-on-surface">Verified Agronomist Review</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold">
              KCC Free
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 shrink-0">
              <img
                className="w-full h-full object-cover"
                alt="Portrait of senior agricultural scientist"
                src={AGRONOMIST_PROFILE.avatarUrl}
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-status-healthy border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-on-surface truncate">
                {AGRONOMIST_PROFILE.name}
              </h4>
              <p className="text-xs text-on-surface-variant truncate">
                {AGRONOMIST_PROFILE.role}
              </p>
              <p className="text-[11px] text-primary font-bold">
                {AGRONOMIST_PROFILE.status} • {AGRONOMIST_PROFILE.replyTime}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onOpenChatModal}
              className="py-2 px-3 rounded-full bg-surface-card border border-outline-variant text-primary text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform hover:border-primary"
              type="button"
            >
              <span className="material-symbols-outlined text-base" data-icon="chat">
                chat
              </span>
              Chat with Doctor
            </button>
            <button
              onClick={onOpenChatModal}
              className="py-2 px-3 rounded-full bg-primary-container text-on-primary text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm hover:bg-primary"
              type="button"
            >
              <span className="material-symbols-outlined text-base" data-icon="phone_in_talk">
                phone_in_talk
              </span>
              Schedule Call
            </button>
          </div>
        </section>

        {/* Section: Past Scan History Carousel */}
        <section className="space-y-2.5 pb-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-on-surface">Recent Crop Scans</h3>
            <button
              onClick={onOpenScanModal}
              className="text-xs text-primary font-bold hover:underline"
              type="button"
            >
              View All (12)
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {/* History Card 1 */}
            <div
              onClick={() => setSelectedCropId('chilli')}
              className="bg-surface-card p-2.5 rounded-xl border border-outline-variant/40 space-y-1.5 cursor-pointer hover:border-primary transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface">Chilli Crop</span>
                <span className="px-1.5 py-0.5 rounded bg-green-100 text-status-healthy text-[10px] font-bold">
                  Healthy
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">10 days ago • Field B</p>
              <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-status-healthy" data-icon="check_circle">
                  check_circle
                </span>
                Thrips Risk: Negligible
              </span>
            </div>

            {/* History Card 2 */}
            <div
              onClick={() => setSelectedCropId('paddy')}
              className="bg-surface-card p-2.5 rounded-xl border border-outline-variant/40 space-y-1.5 cursor-pointer hover:border-primary transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface">Paddy</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold">
                  Resolved
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">22 days ago • Main Plot</p>
              <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-blue-600" data-icon="task_alt">
                  task_alt
                </span>
                Stem Borer Treated
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Toast notifications */}
      {savedToLogToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-primary text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-sm" data-icon="check_circle">
            check_circle
          </span>
          Saved to Farm Log successfully!
        </div>
      )}

      {whatsappToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#25D366] text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-sm" data-icon="share">
            share
          </span>
          Diagnostic summary copied to WhatsApp clipboard!
        </div>
      )}

      {/* Sticky Floating Action Bar for Report */}
      <aside
        aria-label="Action Toolbar"
        className="fixed bottom-16 left-0 right-0 z-30 px-4 max-w-lg mx-auto"
      >
        <div className="bg-surface-card/95 backdrop-blur-md border border-outline-variant/50 p-2.5 rounded-2xl shadow-[0_8px_24px_rgba(28,36,27,0.12)] flex items-center gap-2">
          <button
            aria-label="Voice Ask Doctor AI"
            onClick={() => onOpenVoiceModal()}
            className="flex items-center gap-1.5 py-3 px-3.5 rounded-full bg-secondary-container text-on-secondary-container border border-primary/30 text-xs font-bold shrink-0 active:scale-95 transition-transform shadow-md hover:bg-secondary-container/80"
            type="button"
          >
            <span className="material-symbols-outlined text-xl text-primary animate-pulse" data-icon="mic">
              mic
            </span>
            <span className="hidden sm:inline">Ask Doctor</span>
            <span className="sm:hidden">Ask AI</span>
          </button>

          <button
            onClick={handleSaveToLog}
            className="flex-1 py-3 px-4 rounded-full bg-primary-container text-on-primary text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md hover:bg-primary"
            type="button"
          >
            <span className="material-symbols-outlined text-lg" data-icon="bookmark_add">
              bookmark_add
            </span>
            <span>Save to Farm Log</span>
          </button>

          <button
            aria-label="Share via WhatsApp"
            onClick={handleShareWhatsApp}
            className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 active:scale-95 transition-transform shadow-md hover:opacity-90"
            type="button"
          >
            <span className="material-symbols-outlined text-2xl" data-icon="share">
              share
            </span>
          </button>
        </div>
      </aside>

      {/* Zoom Leaf Modal */}
      {isZoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative max-w-md w-full bg-slate-900 rounded-2xl overflow-hidden p-2">
            <div className="flex justify-between items-center text-white px-2 py-1">
              <span className="text-xs font-bold">{cropData.cropName} - Macro Foliage View</span>
              <button
                onClick={() => setIsZoomModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base" data-icon="close">
                  close
                </span>
              </button>
            </div>
            <div className="overflow-hidden rounded-xl mt-1">
              <img
                src={cropData.imageUrl}
                alt={cropData.altText}
                className="w-full h-80 object-cover scale-125 transition-transform duration-300"
              />
            </div>
            <p className="text-[11px] text-slate-300 p-2 text-center">
              Microscopic concentric spore rings detected on vascular leaf margin.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
