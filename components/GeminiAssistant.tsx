import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { GlassSheet } from './Layouts';
import { showToast } from '../utils/toast';
import { sanitizeInput } from '../utils/security';
import { useTheme } from './ThemeProvider';

// --- Configuration ---
const STORAGE_KEY = 'where2_chat_history_v2';
const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
// ai instance moved to request handler to support dynamic keys

// --- Types ---
interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  sources?: { title: string; uri: string }[];
  places?: { title: string; uri: string }[];
  isError?: boolean;
}

interface GeminiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- Helper: Voice Recognition ---
const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      showToast('Voice input not supported in this browser.', 'error');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
    };
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
    };

    recognition.start();
  };

  return { isListening, transcript, setTranscript, startListening };
};

export const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ isOpen, onClose }) => {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<'auto' | 'search' | 'maps'>('auto');
  
  // Theme Hooks
  const { tokens } = useTheme();
  
  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isListening, transcript, setTranscript, startListening } = useSpeechRecognition();

  // Load History
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse chat history");
      }
    }
  }, []);

  // Save History
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20))); // Keep last 20
    }
  }, [messages]);

  // Sync Voice Transcript
  useEffect(() => {
    if (transcript) {
      setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
      setTranscript('');
    }
  }, [transcript, setTranscript]);

  // Auto Scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating, isOpen]);

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    showToast('Chat history cleared', 'success');
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleSend = async (overrideText?: string) => {
    const textToSend = sanitizeInput(overrideText || input);
    if (!textToSend.trim() || isGenerating) return;

    // Initialize AI here to ensure we use the latest API key (e.g. if selected by user)
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    // 1. Add User Message
    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      text: textToSend,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsGenerating(true);

    // 2. Prepare Context
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const contextPreamble = `Current time: ${timeString}. Location: Johannesburg, South Africa. User Preference context: The user is looking for recommendations. Keep responses concise and friendly.`;

    // 3. Determine Tools based on Mode or heuristic
    let tools = [];
    let modelName = 'gemini-3-flash-preview'; 

    if (mode === 'maps' || (mode === 'auto' && /where|near|location|find|place|map/i.test(textToSend))) {
       tools = [{ googleMaps: {} }];
       modelName = 'gemini-2.5-flash'; 
    } else {
       tools = [{ googleSearch: {} }];
       modelName = 'gemini-3-flash-preview';
    }

    // 4. Create Placeholder AI Message
    const aiMsgId = generateId();
    setMessages(prev => [...prev, {
      id: aiMsgId,
      role: 'model',
      text: '', 
      timestamp: Date.now()
    }]);

    try {
      // 5. Stream Request
      const result = await ai.models.generateContentStream({
        model: modelName,
        contents: [
            { role: 'user', parts: [{ text: contextPreamble + "\n\nQuery: " + textToSend }] }
        ],
        config: {
          tools: tools.length > 0 ? tools : undefined,
        },
      });

      let fullText = '';
      let groundingChunks: any[] = [];
      
      for await (const chunk of result) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          setMessages(prev => prev.map(m => 
            m.id === aiMsgId ? { ...m, text: fullText } : m
          ));
        }

        // Collect grounding metadata from candidates in each chunk if available
        const metadata = chunk.candidates?.[0]?.groundingMetadata;
        if (metadata?.groundingChunks) {
             groundingChunks = [...groundingChunks, ...metadata.groundingChunks];
        }
      }

      // 6. Post-Stream: Extract Grounding Metadata (Aggregated)
      const sources = groundingChunks
        .filter((c: any) => c.web?.uri)
        .map((c: any) => ({ title: c.web.title || 'Source', uri: c.web.uri }));

      const places = groundingChunks
        .filter((c: any) => c.groundingChunkType === 'place-grounding-chunk' || (c.web?.uri && c.web.uri.includes('maps.google')))
        .map((c: any) => ({ 
             title: c.web?.title || "View on Map", 
             uri: c.web?.uri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(textToSend)}`
        }));

      // Dedup sources and places
      const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());
      const uniquePlaces = Array.from(new Map(places.map(p => [p.uri, p])).values());

      setMessages(prev => prev.map(m => 
        m.id === aiMsgId ? { ...m, sources: uniqueSources.length ? uniqueSources : undefined, places: uniquePlaces.length ? uniquePlaces : undefined } : m
      ));

    } catch (err: any) {
      console.error(err);
      setMessages(prev => prev.map(m => 
        m.id === aiMsgId ? { ...m, text: m.text + "\n[Connection interrupted. Please try again.]", isError: true } : m
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex flex-col justify-end pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      
      <GlassSheet className="relative z-10 p-0 pointer-events-auto h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300 overflow-hidden">
        
        {/* --- Header --- */}
        <div className={`p-4 border-b ${tokens.border} flex justify-between items-center ${tokens.glass}`}>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-lg animate-pulse-slow">spark</span>
            </div>
            <div>
                <h2 className="text-sm font-bold text-white">Gemini Assistant</h2>
                <p className="text-[10px] text-gray-400">Powered by Google GenAI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={clearHistory} className="p-2 text-gray-400 hover:text-white transition-colors" title="Clear History">
                <span className="material-symbols-outlined text-lg">delete_sweep</span>
            </button>
            <button onClick={onClose} className={`p-2 rounded-full transition-colors ${tokens.surface2} hover:bg-white/10`}>
                <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* --- Chat Area --- */}
        <div ref={scrollRef} className={`flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar ${tokens.surface}`}>
            {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                    <span className={`material-symbols-outlined text-5xl mb-4 ${tokens.accentPurple} opacity-50`}>assistant</span>
                    <p className="font-bold text-lg mb-2">How can I help?</p>
                    <p className="text-xs text-gray-400 max-w-[250px]">
                        I can help you find places, check events, or plan your night out in Johannesburg.
                    </p>
                </div>
            )}

            {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div 
                        className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                            msg.role === 'user' 
                                ? `${tokens.accentBg} text-white rounded-tr-sm` 
                                : `${tokens.surface2} text-gray-100 rounded-tl-sm border ${tokens.border}`
                        } ${msg.isError ? 'border-red-500/50 text-red-100' : ''}`}
                    >
                        {/* Markdown-ish formatting for line breaks + Sanitized Output */}
                        <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: sanitizeInput(msg.text) }} />
                    </div>

                    {/* Grounding Chips (Sources/Places) */}
                    {(msg.sources || msg.places) && (
                        <div className="mt-2 flex flex-wrap gap-2 max-w-[90%]">
                            {msg.places?.map((p, i) => (
                                <a key={`p-${i}`} href={p.uri} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${tokens.surface2} border ${tokens.border} hover:bg-white/10 text-secondary`}>
                                    <span className="material-symbols-outlined text-[14px]">map</span>
                                    {sanitizeInput(p.title)}
                                </a>
                            ))}
                            {msg.sources?.map((s, i) => (
                                <a key={`s-${i}`} href={s.uri} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] transition-colors truncate max-w-[200px] ${tokens.surface2} border ${tokens.border} hover:bg-white/10 text-gray-300`}>
                                    <span className="material-symbols-outlined text-[12px]">link</span>
                                    {sanitizeInput(s.title)}
                                </a>
                            ))}
                        </div>
                    )}
                    
                    <span className="text-[9px] text-gray-500 mt-1 px-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                </div>
            ))}

            {isGenerating && (
                <div className="flex items-start">
                    <div className={`px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center ${tokens.surface2}`}>
                        <span className="size-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="size-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="size-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                </div>
            )}
        </div>

        {/* --- Suggestions --- */}
        {!isGenerating && (
            <div className={`px-4 py-2 border-t ${tokens.border} bg-black/20 overflow-x-auto no-scrollbar flex gap-2 shrink-0`}>
                {[
                    { label: 'Late spots still open near me', icon: 'nightlife' },
                    { label: 'Plan a Friday Amapiano night in Braam', icon: 'music_note' },
                    { label: 'Chilled date spot in Rosebank at 7pm', icon: 'favorite' },
                    { label: 'Coffee or brunch spots to work from', icon: 'coffee' }
                ].map((s) => (
                    <button
                        key={s.label}
                        onClick={() => handleSend(s.label)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors active:scale-95 ${tokens.surface2} border ${tokens.border} hover:bg-white/10 text-gray-300`}
                    >
                        <span className="material-symbols-outlined text-[14px]">{s.icon}</span>
                        {s.label}
                    </button>
                ))}
            </div>
        )}

        {/* --- Input Area --- */}
        <div className={`p-4 border-t ${tokens.border} pb-8 ${tokens.surface}`}>
            <div className="flex gap-2 items-end">
                <button
                    onClick={isListening ? undefined : startListening}
                    className={`size-12 shrink-0 rounded-2xl flex items-center justify-center transition-all ${
                        isListening 
                            ? 'bg-status-red text-white animate-pulse' 
                            : `${tokens.surface2} text-gray-400 hover:text-white`
                    }`}
                >
                    <span className="material-symbols-outlined">{isListening ? 'mic_off' : 'mic'}</span>
                </button>

                <div className={`flex-1 border ${tokens.border} rounded-2xl flex items-center p-1 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all ${tokens.surface2}`}>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Ask anything..."
                        className="w-full bg-transparent border-none text-sm text-white focus:ring-0 resize-none max-h-[80px] py-2.5 px-3 placeholder:text-gray-600"
                        rows={1}
                        style={{ minHeight: '44px' }}
                    />
                    <button 
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isGenerating}
                        className={`size-9 rounded-xl flex items-center justify-center text-white shadow-lg disabled:opacity-50 disabled:bg-gray-700 transition-all m-1 hover:scale-105 active:scale-95 ${tokens.accentBg}`}
                    >
                        <span className="material-symbols-outlined text-lg">arrow_upward</span>
                    </button>
                </div>
            </div>
            
            <div className="flex justify-center mt-2 gap-4">
               <button onClick={() => setMode('auto')} className={`text-[10px] font-bold uppercase tracking-wider ${mode === 'auto' ? tokens.accentPurple : 'text-gray-600'}`}>Auto</button>
               <button onClick={() => setMode('search')} className={`text-[10px] font-bold uppercase tracking-wider ${mode === 'search' ? tokens.accentPurple : 'text-gray-600'}`}>Search</button>
               <button onClick={() => setMode('maps')} className={`text-[10px] font-bold uppercase tracking-wider ${mode === 'maps' ? tokens.accentPurple : 'text-gray-600'}`}>Maps</button>
            </div>
        </div>
      </GlassSheet>
    </div>
  );
};
