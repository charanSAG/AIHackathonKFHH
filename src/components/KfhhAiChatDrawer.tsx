import React, { useState, useRef, useEffect } from 'react';
import { AI_SUGGESTED_PROMPTS, Language, getT } from '../data/kfhhData';
import { callAskFarmerAI, getN8nConfig, saveN8nConfig, testN8nWebhookConnection } from '../services/api';
import { syncChatToSupabase } from '../lib/supabase';
import {
  buildFarmerAIContext,
  FarmerProfile,
  FarmDetails,
  FarmerCrop,
} from '../services/farmerService';

interface KfhhAiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  location?: string;
  farmerProfile?: FarmerProfile | null;
  farmDetails?: FarmDetails | null;
  cropsList?: FarmerCrop[];
  onOpenAuth?: (mode?: 'register' | 'login') => void;
}

export const KfhhAiChatDrawer: React.FC<KfhhAiChatDrawerProps> = ({
  isOpen,
  onClose,
  lang,
  location,
  farmerProfile,
  farmDetails,
  cropsList,
  onOpenAuth,
}) => {
  const t = getT(lang);
  const [messages, setMessages] = useState<
    { role: 'ai' | 'user'; text: string; time?: string }[]
  >([
    {
      role: 'ai',
      text:
        lang === 'te'
          ? 'నమస్కారం! నేను మీ KFHH ఫార్మర్ AI అసిస్టెంట్ (n8n వర్క్‌ఫ్లో అనుసంధానించబడింది). వాతావరణం, మందుల పిచికారీ సమయం, మండి ధరలు, పంట రక్షణ గురించి ఏదైనా అడగండి.'
          : lang === 'hi'
          ? 'नमस्ते! मैं आपका KFHH किसान AI सलाहकार हूँ (n8n वर्कफ़्लो से कनेक्टेड)। मौसम, मंडी भाव, फसल सुरक्षा और उर्वरक पर कोई भी सवाल पूछें।'
          : 'Namaste! I am your KFHH Farmer AI Assistant connected to your n8n workflow. Ask me anything about weather, spray safety, live mandi prices, and crop protection.',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<number | null>(null);
  const [showN8nSettings, setShowN8nSettings] = useState(false);
  const [n8nStatus, setN8nStatus] = useState<{ testing: boolean; result?: string; success?: boolean }>({
    testing: false,
  });

  const [n8nConfig, setN8nConfig] = useState(getN8nConfig());
  const [conversationId, setConversationId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('kfhh_chat_conversation_id');
      if (saved) return saved;
      const newId = 'conv_' + Date.now();
      sessionStorage.setItem('kfhh_chat_conversation_id', newId);
      return newId;
    }
    return 'conv_' + Date.now();
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleResetChat = () => {
    const newId = 'conv_' + Date.now();
    setConversationId(newId);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('kfhh_chat_conversation_id', newId);
    }
    setMessages([
      {
        role: 'ai',
        text:
          lang === 'te'
            ? 'నమస్కారం! కొత్త సంభాషణ ప్రారంభమైంది. మీ పంట గురించి ఏదైనా అడగండి.'
            : lang === 'hi'
            ? 'नमस्ते! नई बातचीत शुरू हुई। अपनी फसल या मौसम पर सवाल पूछें।'
            : 'Namaste! Starting a fresh session. Ask me anything about your crops, weather, or mandi rates.',
      },
    ]);
  };

  const handleTestWebhook = async () => {
    setN8nStatus({ testing: true });
    const res = await testN8nWebhookConnection(n8nConfig.webhookUrl, n8nConfig.userId);
    if (res.success) {
      setN8nStatus({
        testing: false,
        success: true,
        result: `HTTP ${res.status || 200} OK (${res.latencyMs}ms) - Webhook Dispatched!`,
      });
    } else {
      setN8nStatus({
        testing: false,
        success: false,
        result: `Error: ${res.error || 'Failed'} (${res.latencyMs}ms)`,
      });
    }
  };

  const handleSaveConfig = () => {
    saveN8nConfig(n8nConfig.webhookUrl, n8nConfig.userId);
    setShowN8nSettings(false);
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;
    const userQuery = textToSend.trim();
    setInputVal('');

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', text: userQuery }]);
    setIsLoading(true);

    try {
      // Build real farmer context from Supabase (Requirement 10 & 15)
      const farmerContext = await buildFarmerAIContext(userQuery);

      // Authenticated user ID for the farmer (Requirement 5)
      const effectiveUserId = farmerProfile?.user_id || farmerProfile?.id || n8nConfig.userId;

      // Call n8n workflow directly and through proxy with authenticated farm context & conversational memory
      const aiResponse = await callAskFarmerAI(userQuery, lang, farmerContext, effectiveUserId, conversationId);
      setMessages((prev) => [...prev, { role: 'ai', text: aiResponse }]);

      // Persist to Supabase / Local storage
      syncChatToSupabase({
        farmer_query: userQuery,
        ai_response: aiResponse,
        language: lang,
      }).catch((e) => console.debug('Supabase sync background note:', e));
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text:
            'Namaste! Field advisory: Keep good drainage channels in your plots today, inspect lower foliage for spots, and verify mandi rates before dispatching produce.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Audio speech synthesis
  const handleListen = (text: string, index: number) => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio === index) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(null);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      if (lang === 'te') utterance.lang = 'te-IN';
      else if (lang === 'hi') utterance.lang = 'hi-IN';
      else utterance.lang = 'en-IN';

      utterance.onend = () => setIsPlayingAudio(null);
      utterance.onerror = () => setIsPlayingAudio(null);
      setIsPlayingAudio(index);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Voice speech-to-text recording
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      handleSend(lang === 'te' ? 'ఈ రోజు వర్షం పడుతుందా?' : 'Will it rain today in my field?');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputVal(transcript);
          handleSend(transcript);
        }
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognition.start();
    } catch (e) {
      setIsRecording(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="flex w-full flex-col bg-card shadow-2xl sm:max-w-md h-full border-l border-border animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="border-b border-border bg-background">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2.5">
              <span className="size-9 rounded-2xl bg-primary/15 text-primary flex items-center justify-center text-lg font-black">
                🌾
              </span>
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-1.5 text-foreground leading-tight">
                  Farmer AI
                  <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 border border-amber-500/30 flex items-center gap-1">
                    ⚡ n8n Webhook
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">Kisan Future Helping Hand AI</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowN8nSettings(!showN8nSettings)}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors border ${
                  showN8nSettings
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary/70 text-foreground border-border hover:bg-secondary'
                }`}
                title="n8n Webhook Settings"
                type="button"
              >
                ⚙️ Webhook
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
                aria-label="Close"
                type="button"
              >
                ✕
              </button>
            </div>
          </div>

          {/* n8n Webhook Status & Settings Panel */}
          {showN8nSettings ? (
            <div className="p-3.5 bg-muted/40 border-t border-border space-y-3 animate-in fade-in text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  n8n Workflow Integration
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">POST JSON</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-muted-foreground">Webhook Endpoint</label>
                <input
                  type="text"
                  value={n8nConfig.webhookUrl}
                  onChange={(e) => setN8nConfig({ ...n8nConfig, webhookUrl: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="https://.../webhook/farmer-ai"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-muted-foreground">user_id payload</label>
                <input
                  type="text"
                  value={n8nConfig.userId}
                  onChange={(e) => setN8nConfig({ ...n8nConfig, userId: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="test-user-001"
                />
              </div>

              {n8nStatus.result && (
                <div
                  className={`p-2 rounded-lg font-mono text-[11px] ${
                    n8nStatus.success
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {n8nStatus.result}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={n8nStatus.testing}
                  className="flex-1 rounded-lg bg-secondary py-1.5 font-bold text-secondary-foreground hover:bg-secondary/80 border border-border"
                >
                  {n8nStatus.testing ? 'Testing...' : '⚡ Test Webhook'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="flex-1 rounded-lg bg-primary py-1.5 font-bold text-primary-foreground hover:bg-primary/90"
                >
                  Save Settings
                </button>
              </div>
            </div>
          ) : (
            <div className="px-4 py-2 bg-emerald-500/5 border-t border-border flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-muted-foreground truncate max-w-[260px]">
                <span className="size-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Gemini 2.5 Flash (n8n)</span>
                <span className="truncate font-mono text-[10px] text-muted-foreground">· Memory ON</span>
              </div>
              <button
                type="button"
                onClick={handleResetChat}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 bg-background px-2 py-0.5 rounded border border-border"
                title="Start fresh conversation with new memory window"
              >
                🔄 New Chat
              </button>
            </div>
          )}

          {/* Farmer Profile Supabase Status Bar */}
          {farmerProfile ? (
            <div className="bg-primary/10 border-t border-primary/20 px-4 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-foreground truncate">
                <span>👨‍🌾</span>
                <span className="font-bold text-primary truncate">{farmerProfile.full_name}</span>
                <span className="text-muted-foreground truncate">
                  ({farmerProfile.village}, {farmerProfile.district})
                </span>
              </div>
              <span className="text-[11px] font-semibold text-primary bg-primary/15 px-2 py-0.5 rounded-full shrink-0">
                {cropsList && cropsList.length > 0
                  ? `${cropsList.length} ${cropsList.length === 1 ? 'Crop' : 'Crops'}`
                  : 'Farm Registered'}
              </span>
            </div>
          ) : (
            <div className="bg-amber-500/10 border-t border-amber-500/25 px-4 py-2 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <span>⚠️</span>
                <span className="font-medium text-[11px]">
                  No farmer profile found. Please complete your registration.
                </span>
              </div>
              {onOpenAuth && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth('register');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] shrink-0 active:scale-95 shadow-xs"
                >
                  Register
                </button>
              )}
            </div>
          )}
        </div>

        {/* Message Thread */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 bg-background">
          {messages.map((m, idx) => (
            <div key={idx} className={m.role === 'user' ? 'flex justify-end' : ''}>
              {m.role === 'user' ? (
                <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground text-sm font-medium shadow-xs">
                  <p>{m.text}</p>
                </div>
              ) : (
                <div className="max-w-[94%] space-y-2 bg-card p-4 rounded-3xl border border-border shadow-xs">
                  <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                    <span className="text-xs font-bold text-primary flex items-center gap-1">
                      <span>🌱</span> KFHH Agri Doctor
                    </span>
                    <span className="text-[10px] text-muted-foreground">Verified advisory</span>
                  </div>

                  <p className="text-sm leading-relaxed text-foreground font-normal whitespace-pre-line">
                    {m.text}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/30">
                    <button
                      onClick={() => handleListen(m.text, idx)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-secondary hover:bg-secondary/80 px-3 py-1 text-xs font-semibold text-secondary-foreground active:scale-95 transition-transform"
                      type="button"
                    >
                      <span>{isPlayingAudio === idx ? '⏹️ Stop' : '🔊 Listen'}</span>
                    </button>
                    <button
                      onClick={() => handleSend('Tell me the exact dosage and safety precautions')}
                      className="inline-flex items-center gap-1 rounded-full bg-secondary hover:bg-secondary/80 px-3 py-1 text-xs font-semibold text-secondary-foreground active:scale-95"
                      type="button"
                    >
                      <span>💬 Dosages</span>
                    </button>
                    <button
                      onClick={() => handleSend('Are there any government subsidies for this?')}
                      className="inline-flex items-center gap-1 rounded-full bg-secondary hover:bg-secondary/80 px-3 py-1 text-xs font-semibold text-secondary-foreground active:scale-95"
                      type="button"
                    >
                      <span>🏛️ Subsidies</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="max-w-[92%] flex items-center gap-3 bg-card p-4 rounded-3xl border border-border">
              <span className="size-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              <p className="text-xs font-semibold text-primary animate-pulse">
                Farmer AI analyzing crop science, weather and mandi feeds...
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />

          {/* Prompt Chips */}
          <div className="space-y-1.5 pt-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Frequently asked by farmers:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {AI_SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="cursor-pointer rounded-full bg-secondary hover:bg-secondary/80 px-3 py-1 text-xs font-medium text-secondary-foreground active:scale-95 transition-transform border border-border/50 shadow-2xs"
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input Bar Form */}
        <form
          className="flex items-center gap-2 border-t border-border p-4 bg-card"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputVal);
          }}
        >
          <input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={
              lang === 'te'
                ? 'మీ ప్రశ్న ఇక్కడ అడగండి...'
                : lang === 'hi'
                ? 'अपना सवाल यहाँ पूछें...'
                : 'Ask anything about your farm...'
            }
            className="h-12 flex-1 rounded-2xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className={`size-12 shrink-0 rounded-2xl flex items-center justify-center active:scale-95 transition-transform ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse shadow-md'
                : 'bg-secondary hover:bg-secondary/80 text-foreground'
            }`}
            title="Speak in your regional language"
          >
            🎤
          </button>
          <button
            type="submit"
            disabled={!inputVal.trim() || isLoading}
            className="size-12 shrink-0 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 shadow-sm active:scale-95 transition-transform disabled:opacity-50"
            aria-label="Send"
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  );
};
