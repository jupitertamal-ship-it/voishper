import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Brain, Code, MessageSquare, Check, Copy } from 'lucide-react';

const SCENES = [
  { icon: Globe, label: 'Ingestion', title: 'Scrape & Ingest Data' },
  { icon: Brain, label: 'AI Learning', title: 'Neural Synthesis' },
  { icon: Code, label: 'Embed', title: 'One-Line Deploy' },
  { icon: MessageSquare, label: 'Interaction', title: 'Live AI Support' },
];

function TypingText({ text, delay = 0, speed = 40 }: { text: string; delay?: number; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(interval);
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay, speed]);
  return <>{displayed}<span className="animate-pulse">|</span></>;
}

function Scene1() {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { setDone(true); clearInterval(interval); return 100; }
        return p + 2;
      });
    }, 40);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="space-y-4">
      <div className="glass-panel neon-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-[10px] text-muted-foreground ml-2">Browser</span>
        </div>
        <div className="bg-muted/30 rounded-md px-3 py-2 border border-border/30 font-mono text-sm text-muted-foreground">
          <TypingText text="https://mystore.com" speed={60} />
        </div>
      </div>
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 2 }} className="relative h-1 rounded-full bg-muted/30 overflow-hidden origin-left">
        <motion.div className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: `${progress}%` }} />
      </motion.div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Scanning neural pathways...</span>
        <span className="font-mono text-primary font-bold">{progress}%</span>
      </div>
      <AnimatePresence>
        {done && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
            <Check className="h-4 w-4 text-green-400" />
            <span className="text-xs text-green-400 font-medium">Data Scraped Successfully</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Scene2() {
  const [blocks, setBlocks] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setBlocks(b => b >= 5 ? 5 : b + 1), 500);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -inset-6 rounded-full" style={{ background: `radial-gradient(circle, hsl(var(--primary) / ${0.1 + blocks * 0.06}), transparent 70%)` }} />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="relative">
          <Brain className="h-16 w-16 text-primary" style={{ filter: `drop-shadow(0 0 ${8 + blocks * 4}px hsl(var(--primary) / 0.6))` }} />
        </motion.div>
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        {['FAQs', 'Products', 'Policies', 'Pricing', 'Docs'].map((label, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={i < blocks ? { opacity: 1, y: 0 } : {}} transition={{ type: 'spring' }} className={`text-[10px] px-2.5 py-1 rounded-full border font-medium ${i < blocks ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/20 border-border/20 text-muted-foreground/30'}`}>
            {label}
          </motion.div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center">Knowledge blocks absorbed: <span className="text-primary font-bold">{blocks}/5</span></p>
    </div>
  );
}

function Scene3() {
  const [copied, setCopied] = useState(false);
  const [injected, setInjected] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setCopied(true), 1500);
    const t2 = setTimeout(() => setInjected(true), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div className="space-y-3">
      <div className="glass-panel rounded-lg overflow-hidden border border-border/30">
        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b border-border/20">
          <span className="text-[10px] text-muted-foreground font-mono">embed.html</span>
          <motion.button animate={copied ? { scale: [1, 1.2, 1] } : {}} className="text-[10px] flex items-center gap-1 text-muted-foreground hover:text-foreground">
            {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied!' : 'Copy'}
          </motion.button>
        </div>
        <pre className="p-3 text-[11px] font-mono leading-relaxed overflow-x-auto">
          <code>
            <span className="text-muted-foreground">{'<!-- Voishper Widget -->'}</span>{'\n'}
            <span className="text-primary">{'<script '}</span>
            <span className="text-secondary">{'src='}</span>
            <span className="text-green-400">{'"widget.js"'}</span>{'\n'}
            {'  '}<span className="text-secondary">{'data-bot-id='}</span>
            <span className="text-green-400">{'"abc123"'}</span>
            <span className="text-primary">{'>'}</span>
            <span className="text-primary">{'</script>'}</span>
          </code>
        </pre>
      </div>
      <AnimatePresence>
        {injected && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-panel rounded-lg p-3 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-green-400 font-medium">Widget injected into site</span>
            </div>
            <div className="bg-muted/20 rounded p-2 font-mono text-[10px] text-muted-foreground">
              {'<body>'}{'\n  '}{'...'}{'\n  '}<span className="text-primary">{'<div id="voishper-widget">'}</span>{'\n'}{'</body>'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Scene4() {
  const [showReply, setShowReply] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShowReply(true), 2500); return () => clearTimeout(t); }, []);
  return (
    <div className="glass-panel neon-border rounded-xl overflow-hidden max-w-xs mx-auto">
      <div className="h-10 flex items-center px-3 gap-2 bg-gradient-to-r from-primary/80 to-secondary/80">
        <MessageSquare className="h-4 w-4 text-white" />
        <span className="text-white text-xs font-semibold">Voishper Support</span>
      </div>
      <div className="p-3 space-y-3 min-h-[140px]">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex justify-end">
          <div className="rounded-lg px-3 py-2 text-xs bg-primary/20 text-foreground max-w-[80%]">
            <TypingText text="Where is my order?" delay={600} speed={50} />
          </div>
        </motion.div>
        <AnimatePresence>
          {showReply && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="rounded-lg px-3 py-2 text-xs bg-muted/40 text-foreground max-w-[85%] space-y-1">
                <p>Your order <span className="text-primary font-semibold">#VS-4821</span> shipped via Express on Apr 7.</p>
                <p className="text-muted-foreground">Estimated delivery: <span className="text-green-400">Apr 10</span>. Need the tracking link?</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const SCENE_COMPONENTS = [Scene1, Scene2, Scene3, Scene4];

export default function HowItWorks() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setActive(a => (a + 1) % 4), []);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(next, 6000);
    return () => clearInterval(interval);
  }, [paused, next]);

  const ActiveScene = SCENE_COMPONENTS[active];

  return (
    <section className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">How It <span className="text-gradient">Works</span></h2>
        <p className="text-muted-foreground max-w-lg mx-auto">From data to deployment in four seamless steps.</p>
      </motion.div>

      <div className="glass-panel neon-border rounded-2xl p-6 md:p-8" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        {/* Step indicators */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          {SCENES.map((scene, i) => (
            <button key={i} onClick={() => setActive(i)} className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all duration-300 ${i === active ? 'bg-primary/10' : 'hover:bg-muted/30'}`}>
              <scene.icon className={`h-5 w-5 transition-all ${i === active ? 'text-primary' : 'text-muted-foreground/50'}`} style={i === active ? { filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.5))' } : {}} />
              <span className={`text-[10px] font-medium transition-colors ${i === active ? 'text-primary' : 'text-muted-foreground/50'}`}>{scene.label}</span>
              <div className={`h-0.5 w-full rounded-full transition-all ${i === active ? 'bg-primary' : 'bg-border/30'}`}>
                {i === active && !paused && (
                  <motion.div key={active} initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 6, ease: 'linear' }} className="h-full bg-primary rounded-full" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Scene title */}
        <AnimatePresence mode="wait">
          <motion.h3 key={active} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="text-lg font-bold font-display text-center mb-6">
            Step {active + 1}: {SCENES[active].title}
          </motion.h3>
        </AnimatePresence>

        {/* Scene content */}
        <div className="max-w-md mx-auto min-h-[260px] flex items-center">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="w-full">
              <ActiveScene />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
