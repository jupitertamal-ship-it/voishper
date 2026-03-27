import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { MessageSquare, Zap, BarChart3, Shield, ArrowRight } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <div className="absolute inset-0 plasma-gradient opacity-20" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 neon-border">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold text-gradient font-['Space_Grotesk']">OmniChat AI</span>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate('/auth')}>Sign In</Button>
          <Button onClick={() => navigate('/auth')} className="gap-1">
            Get Started <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-32 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
            <Zap className="h-3.5 w-3.5" /> AI-Powered Customer Support
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Turn your website into a
            <span className="text-gradient"> 24/7 support agent</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Build intelligent chatbots that answer from your knowledge base, capture leads, and hand off to humans when needed. No code required.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" onClick={() => navigate('/auth')} className="gap-2 text-base px-8">
              Start Free <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className="text-base px-8">
              View Demo
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: MessageSquare, title: 'Smart Conversations', desc: 'RAG-powered AI answers from your docs, URLs, and files.' },
            { icon: BarChart3, title: 'Real-time Analytics', desc: 'Track conversations, leads, and bot success rates.' },
            { icon: Shield, title: 'Human Handoff', desc: 'Automatically capture leads when the bot needs help.' },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className="glass-panel neon-border p-6"
            >
              <div className="p-2 rounded-lg bg-primary/10 w-fit mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
