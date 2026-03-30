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
};

// Language detection heuristic
function detectLang(text: string): 'bn' | 'en' | 'banglish' {
  const banglaRange = /[\u0980-\u09FF]/;
  if (banglaRange.test(text)) return 'bn';
  // Banglish patterns
  const banglishWords = /\b(ami|tumi|kemon|achen|kothay|bolte|holo|kore|nai|ache|ki|ta|ar|thik|ase)\b/i;
  if (banglishWords.test(text)) return 'banglish';
  return 'en';
}

export function OmniWidget({ botId, preview = false }: WidgetProps) {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  useEffect(() => {
    if (!botId) return;
    supabase.from('bots').select('*').eq('id', botId).single().then(({ data }) => {
      if (data) {
        setBotConfig(data);
        if (data.whatsapp_number) setWhatsappNumber(data.whatsapp_number);
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

  const colors = botConfig?.colors || { bubble_color: '#00F2FF', header_color: '#6366F1', text_color: '#FFFFFF' };

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

    // Detect language from existing conversation or default
    const lastMsg = messages.filter(m => m.role === 'user').pop()?.content || '';
    const lang = detectLang(lastMsg);
    recognition.lang = lang === 'bn' ? 'bn-BD' : 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('');
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
        body: JSON.stringify({
          messages: newMessages,
          bot_id: botId,
          origin: window.location.origin,
        }),
      });

      if (resp.status === 403) {
        setMessages([...newMessages, { role: 'assistant', content: 'This widget is not authorized for this domain.' }]);
        setLoading(false);
        return;
      }
      if (resp.status === 429) {
        setMessages([...newMessages, { role: 'assistant', content: 'Too many requests. Please try again later.' }]);
        setLoading(false);
        return;
      }
      if (resp.status === 402) {
        setMessages([...newMessages, { role: 'assistant', content: 'Service temporarily unavailable.' }]);
        setLoading(false);
        return;
      }

      // Get WhatsApp number from response header
      const wpNum = resp.headers.get('X-Whatsapp-Number');
      if (wpNum) setWhatsappNumber(wpNum);

      if (!resp.ok || !resp.body) throw new Error('Failed to stream');

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
      setMessages([...newMessages, { role: 'assistant', content: "I'm having trouble connecting. Would you like to leave your contact info?" }]);
      setShowHandoff(true);
    }
    setLoading(false);
  };

  const submitLead = async () => {
    if (!leadName || !leadEmail) return;
    const transcript = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    await supabase.from('leads').insert({
      bot_id: botId,
      name: leadName,
      email: leadEmail,
      chat_transcript: transcript,
    });
    setShowHandoff(false);
    setMessages([...messages, { role: 'assistant', content: `Thanks ${leadName}! A team member will reach out to ${leadEmail} shortly.` }]);
    setLeadName('');
    setLeadEmail('');
  };

  const openWhatsApp = () => {
    const lastMsg = messages.filter(m => m.role === 'user').pop()?.content || 'Hi, I need help';
    window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I need help: ${lastMsg}`)}`, '_blank');
  };

  return (
    <>
      {/* Greeting popup */}
      <AnimatePresence>
        {showGreeting && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 max-w-xs p-4 rounded-xl shadow-xl border border-border/50 bg-card"
          >
            <button onClick={() => setShowGreeting(false)} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
            <p className="text-sm pr-4">{botConfig?.greeting_message || 'Hi! Need help?'}</p>
            <button onClick={() => { setShowGreeting(false); setIsOpen(true); }} className="text-xs text-primary mt-2 hover:underline">
              Chat with us →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] rounded-2xl overflow-hidden shadow-2xl border border-border/50 flex flex-col bg-card"
          >
            {/* Header */}
            <div className="p-4 flex items-center justify-between shrink-0" style={{ backgroundColor: colors.header_color }}>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4" style={{ color: colors.text_color }} />
                </div>
                <div>
                  <span className="font-medium text-sm block" style={{ color: colors.text_color }}>{botConfig?.name || 'Chat'}</span>
                  <span className="text-[10px] opacity-70" style={{ color: colors.text_color }}>● Online</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="opacity-70 hover:opacity-100 transition-opacity">
                <X className="h-4 w-4" style={{ color: colors.text_color }} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <div className="h-12 w-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: colors.bubble_color + '20' }}>
                    <MessageSquare className="h-6 w-6" style={{ color: colors.bubble_color }} />
                  </div>
                  {botConfig?.greeting_message || 'Hi! How can I help?'}
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
                    }`}
                    style={
                      msg.role === 'user'
                        ? { backgroundColor: colors.bubble_color, color: colors.text_color }
                        : { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }
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
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* WhatsApp CTA */}
            {showWhatsapp && whatsappNumber && (
              <div className="px-4 pb-2">
                <button
                  onClick={openWhatsApp}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
                >
                  <Phone className="h-4 w-4" /> Talk to a human on WhatsApp
                </button>
              </div>
            )}

            {/* Handoff Form */}
            {showHandoff && !showWhatsapp && (
              <div className="p-4 border-t border-border/50 bg-muted/30 space-y-2">
                <p className="text-xs text-muted-foreground">Leave your info and we'll get back to you:</p>
                <input className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/50 text-sm" placeholder="Name" value={leadName} onChange={e => setLeadName(e.target.value)} />
                <input className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/50 text-sm" placeholder="Email" type="email" value={leadEmail} onChange={e => setLeadEmail(e.target.value)} />
                <button onClick={submitLead} className="w-full py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: colors.bubble_color, color: colors.text_color }}>Submit</button>
              </div>
            )}

            {/* Input */}
            {!showHandoff && (
              <div className="p-3 border-t border-border/50 shrink-0">
                <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2 items-center">
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={toggleVoice}
                      className={`p-2 rounded-lg transition-all ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                  )}
                  <input
                    className="flex-1 px-3 py-2 rounded-lg bg-muted/50 border border-border/30 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    placeholder={isListening ? 'Listening...' : 'Type a message...'}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="p-2 rounded-lg transition-colors disabled:opacity-40"
                    style={{ backgroundColor: colors.bubble_color, color: colors.text_color }}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bubble */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { setIsOpen(!isOpen); setShowGreeting(false); }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-lg"
        style={{
          backgroundColor: colors.bubble_color,
          boxShadow: `0 0 20px ${colors.bubble_color}40, 0 0 40px ${colors.bubble_color}20`,
        }}
      >
        {isOpen ? (
          <X className="h-6 w-6" style={{ color: colors.text_color }} />
        ) : (
          <MessageSquare className="h-6 w-6" style={{ color: colors.text_color }} />
        )}
      </motion.div>
    </>
  );
}
