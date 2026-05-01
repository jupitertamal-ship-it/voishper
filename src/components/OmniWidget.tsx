import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, Mic, MicOff, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = { role: 'user' | 'assistant'; content: string };

type WidgetProps = {
  botId: string;
  preview?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
};

// ─── Customization ───────────────────────────────────────
const WIDGET_DEFAULTS = {
  primary: '#6366F1',   // Indigo
  secondary: '#06B6D4', // Cyan
};

function detectLang(text: string): 'bn' | 'en' | 'banglish' {
  if (/[\u0980-\u09FF]/.test(text)) return 'bn';
  if (/\b(ami|tumi|kemon|achen|kothay|bolte|holo|kore|nai|ache|ki|ta|ar|thik|ase)\b/i.test(text)) return 'banglish';
  return 'en';
}

export function OmniWidget({
  botId,
  preview = false,
  primaryColor = WIDGET_DEFAULTS.primary,
  secondaryColor = WIDGET_DEFAULTS.secondary,
}: WidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [botConfig, setBotConfig] = useState<any>(null);
  const [showGreeting, setShowGreeting] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [showWhatsapp, setShowWhatsapp] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [bubbleReady, setBubbleReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const gradient = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
    // Delay bubble entrance
    const t = setTimeout(() => setBubbleReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!botId) return;
    supabase.rpc('get_bot_config', { _bot_id: botId }).then(({ data }) => {
      if (data && data.length > 0) {
        setBotConfig(data[0]);
      }
    });
  }, [botId]);

  useEffect(() => {
    if (!botConfig || preview) return;
    const shown = sessionStorage.getItem(`omni-greeting-${botId}`);
    if (shown) return;
    const timer = setTimeout(() => {
      setShowGreeting(true);
      sessionStorage.setItem(`omni-greeting-${botId}`, 'true');
    }, 5000);
    return () => clearTimeout(timer);
  }, [botConfig]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    const lastMsg = messages.filter(m => m.role === 'user').pop()?.content || '';
    recognition.lang = detectLang(lastMsg) === 'bn' ? 'bn-BD' : 'en-US';
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('');
      setInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    let assistantContent = '';
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages, bot_id: botId, origin: window.location.origin }),
      });

      if (resp.status === 403) {
        setMessages([...newMessages, { role: 'assistant', content: 'This widget is not authorized for this domain.' }]);
        setLoading(false);
        return;
      }
      if (resp.status === 429 || resp.status === 402) {
        setMessages([...newMessages, { role: 'assistant', content: '⏳ Our system is under brief maintenance. Please try again in a moment.' }]);
        setLoading(false);
        return;
      }

      const wpNum = resp.headers.get('X-Whatsapp-Number');
      if (wpNum) setWhatsappNumber(wpNum);
      if (!resp.ok || !resp.body) throw new Error('Failed');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages([...newMessages, { role: 'assistant', content: assistantContent }]);
            }
            if (assistantContent.includes('[HANDOFF]')) {
              setShowHandoff(true);
              if (whatsappNumber) setShowWhatsapp(true);
            }
          } catch { break; }
        }
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: "⏳ Our system is under brief maintenance. Please try again in a moment." }]);
      setShowHandoff(true);
    }
    setLoading(false);
  };

  const submitLead = async () => {
    if (!leadName || !leadEmail) return;
    const transcript = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    // Lightweight per-browser identifier for rate limiting (not PII).
    let ipHash = '';
    try {
      const fp = `${navigator.userAgent}|${screen.width}x${screen.height}|${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fp));
      ipHash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {}
    await supabase.rpc('submit_lead', {
      _bot_id: botId,
      _name: leadName,
      _email: leadEmail,
      _chat_transcript: transcript,
      _ip_hash: ipHash,
    });
    setShowHandoff(false);
    setMessages([...messages, { role: 'assistant', content: `Thanks ${leadName}! We'll reach out to ${leadEmail} shortly.` }]);
    setLeadName('');
    setLeadEmail('');
  };

  const openWhatsApp = () => {
    const lastMsg = messages.filter(m => m.role === 'user').pop()?.content || 'Hi, I need help';
    window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I need help: ${lastMsg}`)}`, '_blank');
  };

  return (
    <>
      {/* Greeting toast */}
      <AnimatePresence>
        {showGreeting && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 max-w-[260px] p-3.5 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl"
            style={{ background: 'rgba(15,15,25,0.92)' }}
          >
            <button onClick={() => setShowGreeting(false)} className="absolute top-2 right-2 text-white/40 hover:text-white/80">
              <X className="h-3 w-3" />
            </button>
            <p className="text-xs text-white/80 pr-4 leading-relaxed">{botConfig?.greeting_message || 'Hi! Need help?'}</p>
            <button onClick={() => { setShowGreeting(false); setIsOpen(true); }} className="text-[10px] mt-2 hover:underline" style={{ color: secondaryColor }}>
              Chat with us →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Chat Window ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed bottom-[88px] right-3 sm:right-6 z-50 w-[340px] sm:w-[350px] max-w-[calc(100vw-1.5rem)] h-[480px] max-h-[calc(100vh-7rem)] rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: 'rgba(12,12,20,0.96)',
              boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 60px ${primaryColor}15`,
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Header */}
            <div
              className="px-4 py-3 flex items-center justify-between shrink-0"
              style={{ background: gradient }}
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-sm text-white block leading-tight">{botConfig?.name || 'AI Assistant'}</span>
                  <span className="text-[10px] text-white/60 flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    Online
                  </span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 scrollbar-thin">
              {messages.length === 0 && (
                <div className="text-center py-10 px-4">
                  <div
                    className="h-11 w-11 rounded-full mx-auto mb-3 flex items-center justify-center"
                    style={{ background: `${secondaryColor}18` }}
                  >
                    <MessageSquare className="h-5 w-5" style={{ color: secondaryColor }} />
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed">{botConfig?.greeting_message || 'Hi! How can I help you today?'}</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
                      msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'
                    }`}
                    style={
                      msg.role === 'user'
                        ? { background: gradient, color: '#fff' }
                        : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.88)' }
                    }
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content.replace('[HANDOFF]', '')}
                        </ReactMarkdown>
                      </div>
                    ) : msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm px-4 py-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: secondaryColor }}
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* WhatsApp CTA */}
            {showWhatsapp && whatsappNumber && (
              <div className="px-3 pb-2">
                <button
                  onClick={openWhatsApp}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" /> Talk to a human on WhatsApp
                </button>
              </div>
            )}

            {/* Lead form */}
            {showHandoff && !showWhatsapp && (
              <div className="p-3 border-t border-white/5 space-y-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-[10px] text-white/40">Leave your info and we'll get back to you:</p>
                <input className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/20" placeholder="Name" value={leadName} onChange={e => setLeadName(e.target.value)} />
                <input className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/20" placeholder="Email" type="email" value={leadEmail} onChange={e => setLeadEmail(e.target.value)} />
                <button onClick={submitLead} className="w-full py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: gradient }}>Submit</button>
              </div>
            )}

            {/* Input bar */}
            {!showHandoff && (
              <div className="px-3 py-2.5 border-t border-white/5 shrink-0">
                <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-1.5 items-center">
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={toggleVoice}
                      className={`p-1.5 rounded-lg transition-all ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'text-white/30 hover:text-white/60'}`}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                  )}
                  <input
                    className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/15"
                    placeholder={isListening ? 'Listening...' : 'Type a message...'}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="p-2 rounded-xl transition-all disabled:opacity-30"
                    style={{ background: gradient }}
                  >
                    <Send className="h-3.5 w-3.5 text-white" />
                  </button>
                </form>
                {/* Footer branding */}
                <p className="text-center text-[8px] text-white/20 mt-1.5 tracking-wide">
                  Powered by <span className="text-white/30 font-medium">Voishper</span> | Created by <span className="text-white/30 font-medium">Muntasir</span>
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Floating Bubble (FAB) ─── */}
      <AnimatePresence>
        {bubbleReady && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { setIsOpen(!isOpen); setShowGreeting(false); }}
            className="fixed bottom-5 right-4 sm:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer"
            style={{
              background: gradient,
              boxShadow: `0 4px 24px ${primaryColor}50, 0 0 48px ${secondaryColor}20`,
            }}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X className="h-5 w-5 text-white" />
                </motion.div>
              ) : (
                <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <MessageSquare className="h-5 w-5 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
