import React, { useState, useEffect, useRef } from 'react';
import { LanguageCode } from '../types';
import { LANGUAGES, SAMPLE_QUERIES } from '../data/mockData';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  cropName?: string;
  initialQuery?: string;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  onLanguageChange,
  cropName = 'Tomato',
  initialQuery,
}) => {
  const [isRecording, setIsRecording] = useState(true);
  const [recordSeconds, setRecordSeconds] = useState(5);
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(currentLanguage);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  // Queries
  const [queryIndex, setQueryIndex] = useState(0);
  const [spokenTelugu, setSpokenTelugu] = useState(
    initialQuery || 'ఈ ఆకుమచ్చ తెగులు పక్కన ఉన్న మిరప చేనుకు కూడా వ్యాపిస్తుందా? వర్షం వచ్చేలా ఉంటే ఇప్పుడే మందు కొట్టవచ్చా?'
  );
  const [englishTranslation, setEnglishTranslation] = useState(
    'Will this leaf blight spread to my adjacent chilli plot? Can I spray chemical now if rain is expected this evening?'
  );

  // Analysis result
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnswer, setHasAnswer] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Audio waveform animation values
  const [waveHeights, setWaveHeights] = useState([
    12, 20, 32, 16, 40, 44, 28, 48, 36, 44, 24, 40, 32, 20, 12,
  ]);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && isRecording) {
      interval = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
        // Randomize wave bars slightly for dynamic audio visualization
        setWaveHeights((prev) =>
          prev.map((h) => Math.max(8, Math.min(50, Math.floor(h + (Math.random() * 14 - 7)))))
        );
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isOpen, isRecording]);

  useEffect(() => {
    if (initialQuery) {
      setSpokenTelugu(initialQuery);
    }
  }, [initialQuery]);

  const handleSelectQuickPrompt = (promptKey: string) => {
    if (promptKey === 'spray') {
      setSpokenTelugu('ఈ రోగమునకు సరైన పిచికారీ సమయం ఎప్పుడు? ఉదయమా లేక సాయంత్రమా?');
      setEnglishTranslation('What is the optimal spray window for this blight? Morning or late evening?');
      setQueryIndex(1);
    } else if (promptKey === 'rain') {
      setSpokenTelugu('సాయంత్రం వర్షం పడే అవకాశం ఉంటే ఇప్పుడు మందు కొట్టడం సురక్షితమేనా?');
      setEnglishTranslation('Is it safe to spray fungicide now if rainfall is expected by evening?');
      setQueryIndex(0);
    } else if (promptKey === 'organic') {
      setSpokenTelugu('రసాయనాలు కాకుండా వేపనూనె లేదా ఇతర సేంద్రియ పద్ధతుల్లో ఎలా నివారించాలి?');
      setEnglishTranslation('How to control this using organic Neem Oil solutions instead of synthetic chemicals?');
      setQueryIndex(2);
    } else if (promptKey === 'cost') {
      setSpokenTelugu('ఎకరానికి మందు ఖర్చు ఎంత అవుతుంది? మార్కెట్లో ఏ బ్రాండ్ ఉత్తమం?');
      setEnglishTranslation('What will be the total spray cost per acre, and which brand is most trusted?');
    }
    setHasAnswer(false);
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      setRecordSeconds(0);
      setHasAnswer(false);
    }
  };

  const handleAskDoctor = () => {
    setIsAnalyzing(true);
    setIsRecording(false);
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasAnswer(true);
    }, 1100);
  };

  const handleReset = () => {
    setSpokenTelugu('ఈ ఆకుమచ్చ తెగులు పక్కన ఉన్న మిరప చేనుకు కూడా వ్యాపిస్తుందా? వర్షం వచ్చేలా ఉంటే ఇప్పుడే మందు కొట్టవచ్చా?');
    setEnglishTranslation('Will this leaf blight spread to my adjacent chilli plot? Can I spray chemical now if rain is expected this evening?');
    setHasAnswer(false);
    setRecordSeconds(0);
    setIsRecording(true);
  };

  const handlePlayVoiceAnswer = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
        return;
      }
      const textToSpeak =
        selectedLang === 'te'
          ? 'వర్షం వచ్చే అవకాశం ఉంటే మాంకోజెబ్ మందు కొట్టవద్దు. మందు వర్షపు నీటితో కొట్టుకుపోతుంది. మిరప చేనుకు కూడా ఆల్టర్నేరియా తెగులు వచ్చే అవకాశం ఉన్నందున సరిహద్దు సాళ్లకు పిచికారీ చేయండి.'
          : 'Do not spray chemical if rain is expected within 3 hours, as wash-off occurs. Early blight can moderately cross-infect Solanaceous crops like chilli; spray the boundary rows with Neem oil or Mancozeb.';

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      setIsPlayingAudio(true);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(true);
      setTimeout(() => setIsPlayingAudio(false), 3000);
    }
  };

  if (!isOpen) return null;

  const currentLangObj = LANGUAGES.find((l) => l.code === selectedLang) || LANGUAGES[0];
  const minutes = Math.floor(recordSeconds / 60);
  const seconds = recordSeconds % 60;
  const timeFormatted = `REC ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end max-w-lg mx-auto pointer-events-auto">
      {/* Modal Backdrop with blur */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Sheet Container */}
      <section
        aria-labelledby="voice-modal-title"
        className="relative z-10 w-full bg-white rounded-t-3xl border-t border-slate-100 shadow-[0_-12px_40px_rgba(0,0,0,0.22)] px-5 pt-3 pb-6 flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        {/* Top Drag Handle Pill */}
        <div
          onClick={onClose}
          className="w-12 h-1.5 bg-slate-300/80 rounded-full mx-auto mb-3 shrink-0 cursor-pointer hover:bg-slate-400 transition-colors"
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
          {/* Live Status & Timer */}
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              {isRecording && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-critical opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  isRecording ? 'bg-status-critical' : 'bg-status-healthy'
                }`}
              />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-bold text-status-critical uppercase tracking-wider font-mono">
                  {isRecording ? timeFormatted : 'VOICE PAUSED'}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-[14px] font-bold text-on-surface" id="voice-modal-title">
                  {isRecording ? 'Listening to your voice...' : 'Voice Query Captured'}
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-none mt-0.5">
                Natural dialect transcription active ({cropName} Diagnostic Context)
              </p>
            </div>
          </div>

          {/* Language selector pill & Close button */}
          <div className="flex items-center gap-1.5 relative">
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-canvas border border-outline-variant/60 text-primary text-[11px] font-semibold active:scale-95 transition-transform"
              type="button"
            >
              <span className="material-symbols-outlined text-xs text-primary" data-icon="language">
                language
              </span>
              <span>{currentLangObj.label.split(' ')[0]}</span>
              <span className="material-symbols-outlined text-xs text-on-surface-variant" data-icon="expand_more">
                expand_more
              </span>
            </button>

            {showLangDropdown && (
              <div className="absolute top-9 right-8 w-44 bg-white rounded-xl shadow-xl border border-outline-variant/40 py-1 z-50 animate-in fade-in zoom-in-95">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setSelectedLang(l.code);
                      onLanguageChange(l.code);
                      setShowLangDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between ${
                      selectedLang === l.code ? 'text-primary font-bold bg-primary/10' : 'text-on-surface hover:bg-slate-50'
                    }`}
                  >
                    <span>{l.label}</span>
                    <span className="text-[10px] text-on-surface-variant">{l.dialectTag}</span>
                  </button>
                ))}
              </div>
            )}

            <button
              aria-label="Close voice assistant"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-on-surface flex items-center justify-center transition-colors active:scale-95"
              type="button"
            >
              <span className="material-symbols-outlined text-base" data-icon="close">
                close
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Animated Waveform Visualizer */}
        <div className="my-3 px-4 py-2.5 bg-gradient-to-r from-emerald-50/70 via-primary-container/10 to-emerald-50/70 rounded-2xl border border-primary/20 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-1.5 w-full h-12 px-2">
            {waveHeights.map((h, i) => (
              <div
                key={i}
                className={`w-1.5 bg-gradient-to-t from-primary to-accent-mint rounded-full transition-all duration-300 ${
                  isRecording ? 'opacity-100' : 'opacity-40'
                }`}
                style={{ height: `${isRecording ? h : Math.max(6, h / 2.5)}px` }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-primary font-semibold">
            <span className="material-symbols-outlined text-xs" data-icon="graphic_eq">
              graphic_eq
            </span>
            <span>Detecting Voice Pitch &amp; Modulation · Low Background Noise</span>
          </div>
        </div>

        {/* Live Speech Transcription Display */}
        <div className="p-3 bg-surface-canvas rounded-2xl border border-primary/25 space-y-2 relative shadow-inner">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary uppercase tracking-wide">
              <span className="material-symbols-outlined text-xs" data-icon="chat_bubble">
                chat_bubble
              </span>
              Live Farmer Query ({currentLangObj.nativeLabel} విశ్లేషణ)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-status-healthy text-[10px] font-bold border border-status-healthy/30">
              <span className="material-symbols-outlined text-[11px]" data-icon="verified">
                verified
              </span>
              98% Confidence · {currentLangObj.dialectTag}
            </span>
          </div>

          {/* Spoken Native Content */}
          <div className="p-2.5 rounded-xl bg-white border border-outline-variant/40 shadow-sm">
            <p className="text-[13px] font-semibold text-on-surface leading-snug">
              "{spokenTelugu}"
            </p>
          </div>

          {/* Real-time Translation Card */}
          <div className="p-2.5 rounded-xl bg-primary-container/10 border border-primary/20">
            <div className="flex items-center gap-1 text-[11px] font-bold text-primary mb-0.5">
              <span className="material-symbols-outlined text-xs" data-icon="translate">
                translate
              </span>
              <span>Instant English Translation:</span>
            </div>
            <p className="text-[12px] text-on-surface leading-relaxed">
              "{englishTranslation}"
            </p>
          </div>
        </div>

        {/* Doctor AI Response Card (Appears after query submission) */}
        {isAnalyzing && (
          <div className="mt-3 p-4 bg-emerald-50 rounded-2xl border border-primary/30 flex items-center justify-center gap-3">
            <span className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-xs font-bold text-primary">
              AI Crop Doctor analyzing leaf pathology &amp; weather radar...
            </span>
          </div>
        )}

        {hasAnswer && !isAnalyzing && (
          <div className="mt-3 p-3.5 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 rounded-2xl border-2 border-primary/40 shadow-sm space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-primary/20">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">
                  <span className="material-symbols-outlined text-sm" data-icon="smart_toy">
                    smart_toy
                  </span>
                </span>
                <span className="text-xs font-bold text-primary">Doctor AI Agronomist Verdict</span>
              </div>
              <button
                onClick={handlePlayVoiceAnswer}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary text-white text-[11px] font-bold active:scale-95 transition-transform"
                type="button"
              >
                <span className="material-symbols-outlined text-xs" data-icon={isPlayingAudio ? 'stop' : 'volume_up'}>
                  {isPlayingAudio ? 'stop' : 'volume_up'}
                </span>
                <span>{isPlayingAudio ? 'Stop Voice' : 'Listen Answer'}</span>
              </button>
            </div>

            <div className="space-y-1.5 text-xs text-on-surface">
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-medium">
                ⚠️ <strong>Rain Safety Window:</strong> If rain is expected within 2 to 3 hours,{' '}
                <strong>DO NOT spray chemical fungicide</strong> now. It will wash off. Wait for morning or add a
                non-ionic silicone spreader/sticker (0.5ml/L).
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 font-medium">
                🌱 <strong>Spread to Adjacent Chilli:</strong> Tomato Early Blight (Alternaria solani) primarily affects
                Solanaceae crops. Chilli has moderate susceptibility. As a precaution, spray a border barrier row on your
                chilli plot with 5ml/L Neem Oil.
              </div>
            </div>
          </div>
        )}

        {/* Contextual Quick Prompts / Tags */}
        <div className="mt-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <span className="text-[11px] font-bold text-on-surface-variant shrink-0 flex items-center gap-0.5">
              <span className="material-symbols-outlined text-xs text-primary" data-icon="smart_toy">
                smart_toy
              </span>
              Quick:
            </span>
            <button
              onClick={() => handleSelectQuickPrompt('spray')}
              className="px-2.5 py-1 rounded-full bg-white border border-outline-variant/60 text-on-surface text-[11px] font-medium hover:border-primary active:scale-95 transition-transform shrink-0 flex items-center gap-1 shadow-sm"
              type="button"
            >
              <span className="text-primary font-bold">+</span>
              <span>Spray timing?</span>
            </button>
            <button
              onClick={() => handleSelectQuickPrompt('rain')}
              className="px-2.5 py-1 rounded-full bg-white border border-outline-variant/60 text-on-surface text-[11px] font-medium hover:border-primary active:scale-95 transition-transform shrink-0 flex items-center gap-1 shadow-sm"
              type="button"
            >
              <span className="text-primary font-bold">+</span>
              <span>Rain safety window?</span>
            </button>
            <button
              onClick={() => handleSelectQuickPrompt('organic')}
              className="px-2.5 py-1 rounded-full bg-white border border-outline-variant/60 text-on-surface text-[11px] font-medium hover:border-primary active:scale-95 transition-transform shrink-0 flex items-center gap-1 shadow-sm"
              type="button"
            >
              <span className="text-primary font-bold">+</span>
              <span>Organic alternative?</span>
            </button>
            <button
              onClick={() => handleSelectQuickPrompt('cost')}
              className="px-2.5 py-1 rounded-full bg-white border border-outline-variant/60 text-on-surface text-[11px] font-medium hover:border-primary active:scale-95 transition-transform shrink-0 flex items-center gap-1 shadow-sm"
              type="button"
            >
              <span className="text-primary font-bold">+</span>
              <span>Cost per acre?</span>
            </button>
          </div>
        </div>

        {/* Voice Modal Bottom Control Bar */}
        <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-3">
          {/* Reset / Clear Button */}
          <button
            aria-label="Reset Voice Input"
            onClick={handleReset}
            className="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-on-surface-variant flex items-center justify-center shrink-0 border border-outline-variant/40 active:scale-95 transition-transform"
            type="button"
          >
            <span className="material-symbols-outlined text-xl" data-icon="delete">
              delete
            </span>
          </button>

          {/* Large Glowing Pulsing Mic Button (Active State) */}
          <div className="relative flex items-center justify-center shrink-0">
            {isRecording && (
              <>
                <span className="absolute w-20 h-20 rounded-full bg-primary/20 animate-ping" />
                <span className="absolute w-16 h-16 rounded-full bg-accent-mint/40 animate-pulse" />
              </>
            )}
            <button
              aria-label={isRecording ? 'Pause Recording' : 'Resume Recording'}
              onClick={handleToggleRecord}
              className={`relative w-16 h-16 rounded-full ${
                isRecording ? 'bg-primary-container text-on-primary' : 'bg-slate-700 text-white'
              } flex items-center justify-center shadow-xl shadow-primary/30 border-4 border-white active:scale-95 transition-transform hover:bg-primary`}
              type="button"
            >
              <span
                className="material-symbols-outlined text-3xl"
                data-icon="mic"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                mic
              </span>
            </button>
          </div>

          {/* Ask Doctor AI Action Button */}
          <button
            onClick={handleAskDoctor}
            className="flex-1 py-3 px-3.5 rounded-full bg-primary-container text-on-primary text-[13px] font-bold flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 active:scale-95 transition-transform hover:bg-primary"
            type="button"
          >
            <span className="truncate">Ask Doctor AI / విశ్లేషించండి</span>
            <span className="material-symbols-outlined text-lg shrink-0" data-icon="send">
              send
            </span>
          </button>
        </div>
      </section>
    </div>
  );
};
