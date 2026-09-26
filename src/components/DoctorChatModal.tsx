import React, { useState } from 'react';
import { AGRONOMIST_PROFILE } from '../data/mockData';
import { callDoctorChat } from '../services/api';

interface DoctorChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  cropName?: string;
}

export const DoctorChatModal: React.FC<DoctorChatModalProps> = ({
  isOpen,
  onClose,
  cropName = 'Tomato',
}) => {
  const [messages, setMessages] = useState<{ sender: 'doc' | 'farmer'; text: string; time: string }[]>([
    {
      sender: 'doc',
      text: `Namaste Farmer! I reviewed your ${cropName} leaf scan. Please describe the symptoms you are noticing or ask about treatment dosages.`,
      time: '10:26 AM',
    },
    {
      sender: 'farmer',
      text: `Doctor garu, lower leaves are showing spots and drying up. Can I spray bio-fungicide or neem oil today?`,
      time: '10:28 AM',
    },
    {
      sender: 'doc',
      text: 'Always check local rain forecast before spraying so the protective coating does not wash off. Better spray in early morning (6:30 AM) with recommended dilution and sticker.',
      time: '10:30 AM',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isConsulting, setIsConsulting] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!inputText.trim() || isConsulting) return;
    const userText = inputText.trim();
    const newMsg = { sender: 'farmer' as const, text: userText, time: 'Just now' };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setIsConsulting(true);

    try {
      const history = [...messages, newMsg].map((m) => ({
        role: (m.sender === 'farmer' ? 'user' : 'model') as 'user' | 'model',
        text: m.text,
      }));

      const reply = await callDoctorChat(history, cropName);

      setMessages((prev) => [
        ...prev,
        {
          sender: 'doc' as const,
          text: reply,
          time: 'Just now',
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'doc' as const,
          text: `Understood. Make sure to prune yellowed leaves and keep 4 hours rain-free drying window. If spots expand, switch to Azoxystrobin (1ml/L).`,
          time: 'Just now',
        },
      ]);
    } finally {
      setIsConsulting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-card rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-border flex flex-col h-[80vh] text-foreground">
        {/* Chat Header */}
        <div className="p-3.5 bg-muted/40 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-primary/30 shrink-0">
              <img
                src={AGRONOMIST_PROFILE.avatarUrl}
                alt={AGRONOMIST_PROFILE.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-card" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                {AGRONOMIST_PROFILE.name}
                <span className="text-[10px] font-semibold text-primary px-1.5 py-0.5 rounded-md bg-primary/10">
                  AI Doc
                </span>
              </h3>
              <p className="text-[10px] text-muted-foreground font-semibold">Active now • KVK Warangal</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <a
              href="tel:18001801551"
              className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 active:scale-95 text-xs font-bold"
              title="Kisan Call Centre Toll Free"
            >
              📞
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-background">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex flex-col ${m.sender === 'farmer' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  m.sender === 'farmer'
                    ? 'bg-primary text-primary-foreground font-medium rounded-br-none shadow-xs'
                    : 'bg-card border border-border text-foreground font-normal rounded-bl-none shadow-xs'
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>
                <span
                  className={`block text-[9px] mt-1 ${
                    m.sender === 'farmer' ? 'text-primary-foreground/75 text-right' : 'text-muted-foreground'
                  }`}
                >
                  {m.time}
                </span>
              </div>
            </div>
          ))}

          {isConsulting && (
            <div className="flex items-center gap-2 p-2 bg-card rounded-2xl border border-border max-w-[70%]">
              <span className="size-3 rounded-full bg-primary animate-ping" />
              <span className="text-[11px] text-primary font-medium">Doctor reviewing advice...</span>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-3 bg-card border-t border-border flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Ask Dr. Ramesh about ${cropName}...`}
            className="flex-1 bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isConsulting}
            className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 active:scale-95 disabled:opacity-50 text-xs font-bold"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};
