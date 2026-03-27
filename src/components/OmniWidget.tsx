import { useState, useEffect, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { MessageSquare, X, Send, User, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = { role: 'user' | 'assistant'; content: string };

type WidgetProps = {
  botId: string;
  preview?: boolean;
};

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  const savedPos = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('omni-widget-pos') || 'null') : null;

  useEffect(() => {
    if (!botId) return;
    supabase.from('bots').select('*').eq('id', botId).single().then(({ data }) => {
      if (data) setBotConfig(data);
    });
  }, [botId]);

  // Pro-active greeting
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
        body: JSON.stringify({ messages: newMessages, bot_id: botId }),
      });

      if (resp.status === 429) {
        setMessages([...newMessages, { role: 'assistant', content: 'Too many requests. Please try again later.' }]);
        setLoading(false);
        return;
      }
      if (resp.status === 402) {
        setMessages([...newMessages, { role: 'assistant', content: 'Service temporarily unavailable. Please try again later.' }]);
        setLoading(false);
        return;
      }

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
            // Check for handoff signal
            if (parsed.choices?.[0]?.delta?.content?.includes('[HANDOFF]') || parsed.handoff) {
              setShowHandoff(true);
            }
          } catch { break; }
        }
      }
    } catch (e) {
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

  return (
    <>
      {/* Greeting popup */}
      {showGreeting && !isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
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

      {/* Chat Drawer */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-8rem)] rounded-2xl overflow-hidden shadow-2xl border border-border/50 flex flex-col bg-card"
        >
          {/* Header */}
          <div className="p-4 flex items-center justify-between shrink-0" style={{ backgroundColor: colors.header_color }}>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" style={{ color: colors.text_color }} />
              <span className="font-medium text-sm" style={{ color: colors.text_color }}>{botConfig?.name || 'Chat'}</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="opacity-70 hover:opacity-100 transition-opacity">
              <X className="h-4 w-4" style={{ color: colors.text_color }} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                {botConfig?.greeting_message || 'Hi! How can I help?'}
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'rounded-br-md'
                      : 'rounded-bl-md'
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
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Handoff Form */}
          {showHandoff && (
            <div className="p-4 border-t border-border/50 bg-muted/30 space-y-2">
              <p className="text-xs text-muted-foreground">Leave your info and we'll get back to you:</p>
              <input
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/50 text-sm"
                placeholder="Name"
                value={leadName}
                onChange={e => setLeadName(e.target.value)}
              />
              <input
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/50 text-sm"
                placeholder="Email"
                type="email"
                value={leadEmail}
                onChange={e => setLeadEmail(e.target.value)}
              />
              <button
                onClick={submitLead}
                className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: colors.bubble_color, color: colors.text_color }}
              >
                Submit
              </button>
            </div>
          )}

          {/* Input */}
          {!showHandoff && (
            <div className="p-3 border-t border-border/50 shrink-0">
              <form
                onSubmit={e => { e.preventDefault(); sendMessage(); }}
                className="flex gap-2"
              >
                <input
                  className="flex-1 px-3 py-2 rounded-lg bg-muted/50 border border-border/30 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  placeholder="Type a message..."
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

      {/* Floating Bubble */}
      <motion.div
        drag
        dragMomentum={false}
        dragConstraints={{ top: -window.innerHeight + 100, bottom: 0, left: -window.innerWidth + 100, right: 0 }}
        initial={savedPos || { x: 0, y: 0 }}
        onDragEnd={(_, info) => {
          localStorage.setItem('omni-widget-pos', JSON.stringify({ x: info.point.x > 0 ? 0 : info.point.x, y: info.point.y > 0 ? 0 : info.point.y }));
        }}
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
