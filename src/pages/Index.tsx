import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Zap, BarChart3, Shield, ArrowRight, Star, Users, Bot, Globe, FileText, Code, Mic, ChevronLeft, ChevronRight, X, Crown, Check } from 'lucide-react';

const STATS = [
  { icon: Bot, label: 'AI Agents Created', value: '5,000+' },
  { icon: Users, label: 'Active Users Worldwide', value: '1.2M+' },
  { icon: Star, label: 'Average Rating', value: '4.9/5' },
];

const FEATURES = [
  { icon: MessageSquare, title: 'Smart Conversations', desc: 'RAG-powered AI answers from your docs, URLs, and files.' },
  { icon: BarChart3, title: 'Real-time Analytics', desc: 'Track conversations, leads, and bot success rates live.' },
  { icon: Shield, title: 'Human Handoff', desc: 'Automatically capture leads when the bot needs help.' },
];

const WHY_ITEMS = [
  { icon: Zap, title: 'Ultra-Fast Training', desc: 'Your AI learns your business in seconds, not hours.' },
  { icon: Globe, title: 'Universal Compatibility', desc: 'Works on WordPress, Shopify, React, and Plain HTML.' },
  { icon: Mic, title: 'Voice-First Experience', desc: 'The only widget with a built-in glowing voice visualizer.' },
];

const DEMO_STEPS = [
  { title: 'Connect your data', desc: 'Drop a URL, upload a PDF, or paste raw text. Voishper ingests it all.', visual: 'ingest' },
  { title: 'Customize your AI', desc: 'Set the personality, brand colors, and greeting message in seconds.', visual: 'customize' },
  { title: 'Deploy with 1 line of code', desc: 'Copy one script tag. Paste into your site. Done.', visual: 'deploy' },
];

function DemoVisual({ step }: { step: string }) {
  if (step === 'ingest') {
    return (
      <div className="w-full max-w-sm mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel neon-border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Globe className="h-4 w-4 text-primary" /> Scrape Website</div>
          <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.5, ease: 'easeInOut' }} className="h-9 rounded-lg bg-muted/50 border border-border/50 flex items-center px-3 overflow-hidden">
            <span className="text-sm text-muted-foreground whitespace-nowrap">https://your-website.com</span>
          </motion.div>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.2 }} className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400">Content scraped successfully!</span>
          </motion.div>
          <div className="border-t border-border/30 pt-3 flex items-center gap-3">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.6 }} className="flex items-center gap-2 text-xs bg-muted/40 rounded-lg px-3 py-2 border border-border/30">
              <FileText className="h-3 w-3 text-secondary" /> product-docs.pdf
            </motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.9 }} className="flex items-center gap-2 text-xs bg-muted/40 rounded-lg px-3 py-2 border border-border/30">
              <FileText className="h-3 w-3 text-secondary" /> faq.txt
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }
  if (step === 'customize') {
    return (
      <div className="w-full max-w-sm mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel neon-border rounded-xl p-5 space-y-4">
          <div className="flex gap-3">
            {['#3399FF', '#A855F7', '#EC4899'].map((c, i) => (
              <motion.div key={c} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.2, type: 'spring' }}
                className="h-8 w-8 rounded-full border-2 border-border/50 cursor-pointer"
                style={{ backgroundColor: c, boxShadow: i === 0 ? `0 0 12px ${c}60` : 'none' }}
              />
            ))}
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="rounded-xl overflow-hidden border border-border/50">
            <div className="h-10 flex items-center px-3 gap-2" style={{ backgroundColor: '#A855F7' }}>
              <MessageSquare className="h-4 w-4 text-white" />
              <span className="text-white text-xs font-medium">Voishper Bot</span>
            </div>
            <div className="bg-card p-3">
              <div className="rounded-lg p-2.5 text-xs max-w-[75%]" style={{ backgroundColor: '#3399FF20', color: 'hsl(var(--foreground))' }}>
                Hi there! 👋 How can I help?
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }
  return (
    <div className="w-full max-w-sm mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel neon-border rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Code className="h-4 w-4 text-primary" /> Embed Code</div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="bg-muted/30 rounded-lg p-3 border border-border/30 font-mono text-xs leading-relaxed overflow-hidden">
          <span className="text-muted-foreground">{'<!-- Voishper Widget -->'}</span><br />
          <span className="text-primary">{'<script'}</span>
          <span className="text-secondary">{' src='}</span>
          <span className="text-green-400">{'"voishper.js"'}</span>
          <span className="text-primary">{'>'}</span>
          <span className="text-primary">{'</script>'}</span>
        </motion.div>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.5, type: 'spring' }} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-400" />
          <span className="text-xs text-green-400">Widget live on your site!</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.5, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 2, type: 'spring' }} className="flex justify-end">
          <div className="h-10 w-10 rounded-full flex items-center justify-center shadow-lg bg-primary" style={{ boxShadow: '0 0 20px hsl(var(--primary) / 0.4)' }}>
            <MessageSquare className="h-5 w-5 text-primary-foreground" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

const Index = () => {
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      <div className="wave-bg" />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 plasma-gradient opacity-20" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <img src="/images/voishper-logo.png" alt="Voishper" className="h-10 w-10 rounded-lg" />
          <span className="text-lg font-bold text-gradient font-display">Voishper</span>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate('/auth')}>Sign In</Button>
          <Button onClick={() => navigate('/auth')} className="gap-1">
            Get Started <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-16 md:pt-24 pb-12 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
            <Zap className="h-3.5 w-3.5" /> Voice & Chat Solutions
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 font-display">
            Turn your website into a
            <span className="text-gradient"> 24/7 support agent</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Build intelligent chatbots that answer from your knowledge base, capture leads, and hand off to humans when needed. No code required.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" onClick={() => navigate('/auth')} className="gap-2 text-base px-8 h-12 neon-glow">
              Start Free <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => setShowDemo(true)} className="text-base px-8 h-12">
              View Demo
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8">
          {STATS.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.15 }} className="flex flex-col items-center text-center gap-2 py-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" style={{ filter: 'drop-shadow(0 0 6px hsl(var(--primary) / 0.5))' }} />
              </div>
              <span className="text-2xl md:text-3xl font-bold font-display">{stat.value}</span>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ delay: i * 0.15 }} className="glass-panel neon-border p-6 hover:border-primary/40 transition-colors">
              <div className="p-2 rounded-lg bg-primary/10 w-fit mb-4"><f.icon className="h-5 w-5 text-primary" /></div>
              <h3 className="font-semibold mb-2 font-display">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Why Voishper */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">Why <span className="text-gradient">Voishper</span>?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">What makes us different from every other chatbot builder.</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6">
          {WHY_ITEMS.map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ delay: i * 0.15 }} className="glass-panel p-6 text-center hover:border-primary/30 border border-border/50 transition-colors rounded-xl">
              <div className="p-3 rounded-xl bg-primary/10 w-fit mx-auto mb-4" style={{ boxShadow: '0 0 20px hsl(var(--primary) / 0.15)' }}>
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2 font-display">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">Simple <span className="text-gradient">Pricing</span></h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Start free, upgrade when you need more power.</p>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="glass-panel p-8 rounded-xl border border-border/50 h-full">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold font-display">Free</h3>
              </div>
              <p className="text-4xl font-bold font-display mb-1">$0</p>
              <p className="text-sm text-muted-foreground mb-6">Forever free</p>
              <ul className="space-y-3 text-sm mb-8">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 1 website scrape</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 50 AI messages / month</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Lead capture</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Analytics dashboard</li>
              </ul>
              <Button variant="outline" onClick={() => navigate('/auth')} className="w-full">
                Get Started
              </Button>
            </div>
          </motion.div>
          {/* Pro */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <div className="glass-panel neon-border p-8 rounded-xl h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-bl from-yellow-500/20 to-transparent w-32 h-32" />
              <div className="flex items-center gap-2 mb-4">
                <Crown className="h-5 w-5 text-yellow-400" />
                <h3 className="text-xl font-bold font-display">Pro</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-medium">POPULAR</span>
              </div>
              <p className="text-4xl font-bold font-display mb-1">৳500</p>
              <p className="text-sm text-muted-foreground mb-6">per month</p>
              <ul className="space-y-3 text-sm mb-8">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Unlimited website scraping</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Unlimited AI messages</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Voice support (coming soon)</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Priority support</li>
              </ul>
              <Button onClick={() => navigate('/auth')} className="w-full neon-glow gap-2">
                <Crown className="h-4 w-4" /> Upgrade to Pro
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-panel neon-border rounded-2xl p-10 md:p-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">Ready to give your website a voice?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">Join thousands of businesses already using Voishper to support customers 24/7.</p>
          <Button size="lg" onClick={() => navigate('/auth')} className="gap-2 text-base px-10 h-14 text-lg neon-glow">
            Get Started <ArrowRight className="h-5 w-5" />
          </Button>
        </motion.div>
      </section>

      <footer className="relative z-10 border-t border-border/30 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Voishper. All rights reserved.</p>
        <p className="mt-1 text-xs">Created by Muntasir</p>
      </footer>

      {/* Demo Overlay */}
      <AnimatePresence>
        {showDemo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background/90 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-lg relative">
              <button onClick={() => { setShowDemo(false); setDemoStep(0); }} className="absolute -top-12 right-0 text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-6 w-6" />
              </button>
              <div className="flex items-center justify-center gap-2 mb-8">
                {DEMO_STEPS.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === demoStep ? 'w-8 bg-primary' : 'w-3 bg-muted-foreground/30'}`} />
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={demoStep} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }} className="text-center space-y-6">
                  <div>
                    <span className="text-xs text-primary font-medium uppercase tracking-wider">Step {demoStep + 1} of {DEMO_STEPS.length}</span>
                    <h3 className="text-2xl font-bold font-display mt-2">{DEMO_STEPS[demoStep].title}</h3>
                    <p className="text-muted-foreground mt-2">{DEMO_STEPS[demoStep].desc}</p>
                  </div>
                  <DemoVisual step={DEMO_STEPS[demoStep].visual} />
                </motion.div>
              </AnimatePresence>
              <div className="flex items-center justify-between mt-8">
                <Button variant="ghost" onClick={() => setDemoStep(Math.max(0, demoStep - 1))} disabled={demoStep === 0} className="gap-1">
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                {demoStep < DEMO_STEPS.length - 1 ? (
                  <Button onClick={() => setDemoStep(demoStep + 1)} className="gap-1">Next <ChevronRight className="h-4 w-4" /></Button>
                ) : (
                  <Button onClick={() => { setShowDemo(false); navigate('/auth'); }} className="gap-1 neon-glow">Get Started <ArrowRight className="h-4 w-4" /></Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
