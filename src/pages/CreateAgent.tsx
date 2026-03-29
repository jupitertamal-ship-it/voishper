import { useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, FileText, Upload, Loader2, CheckCircle2, Sparkles, Copy, ArrowRight, ArrowLeft, Eye, Trash2, Code } from 'lucide-react';

type ScrapedData = {
  source_name: string;
  content_text: string;
  type: 'url' | 'file';
};

const STEPS = ['Enter Website', 'Review Data', 'Create Agent', 'Get Embed Code'];

const CreateAgent = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);

  // Step 1
  const [url, setUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapedItems, setScrapedItems] = useState<ScrapedData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Step 3
  const [botName, setBotName] = useState('');
  const [greeting, setGreeting] = useState('Hi there! 👋 How can I help you today?');
  const [creating, setCreating] = useState(false);
  const [createdBotId, setCreatedBotId] = useState<string | null>(null);

  // Step 4
  const [copied, setCopied] = useState(false);

  const scrapeUrl = async () => {
    if (!url) return;
    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-url', {
        body: { url, bot_id: 'preview' },
      });
      if (error) throw error;
      const content = data?.content_length
        ? `Scraped ${data.content_length} characters from ${data.source_name || url}`
        : '';
      
      // Fetch the actual content by re-scraping directly for preview
      const resp = await fetch(url.startsWith('http') ? url : `https://${url}`);
      const html = await resp.text();
      const cleanText = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 5000);

      setScrapedItems(prev => [...prev, {
        source_name: data?.source_name || url,
        content_text: cleanText,
        type: 'url',
      }]);
      toast({ title: 'Website scraped successfully!' });
      setUrl('');
    } catch (e: any) {
      // Fallback: basic fetch
      try {
        const resp = await fetch(url.startsWith('http') ? url : `https://${url}`);
        const html = await resp.text();
        const cleanText = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 50000);
        setScrapedItems(prev => [...prev, {
          source_name: url,
          content_text: cleanText.substring(0, 5000),
          type: 'url',
        }]);
        toast({ title: 'Website content fetched!' });
        setUrl('');
      } catch {
        toast({ title: 'Scrape failed', description: e.message, variant: 'destructive' });
      }
    }
    setScraping(false);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      if (!file.name.endsWith('.txt') && !file.name.endsWith('.pdf')) {
        toast({ title: 'Unsupported file', description: 'Only .txt and .pdf supported.', variant: 'destructive' });
        continue;
      }
      const text = await file.text();
      setScrapedItems(prev => [...prev, {
        source_name: file.name,
        content_text: text.substring(0, 5000),
        type: 'file',
      }]);
    }
    toast({ title: 'Files added!' });
    setUploading(false);
  };

  const removeItem = (index: number) => {
    setScrapedItems(prev => prev.filter((_, i) => i !== index));
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const createBot = async () => {
    if (!user || scrapedItems.length === 0) return;
    setCreating(true);
    try {
      // 1. Create bot
      const { data: bot, error: botErr } = await supabase.from('bots').insert({
        user_id: user.id,
        name: botName || 'My AI Agent',
        greeting_message: greeting,
        system_prompt: `You are a helpful AI assistant. Answer questions based on the knowledge base provided. Be concise and helpful.`,
      }).select('id').single();
      if (botErr) throw botErr;

      // 2. Insert knowledge items
      for (const item of scrapedItems) {
        await supabase.from('knowledge_items').insert({
          bot_id: bot.id,
          type: item.type,
          source_name: item.source_name,
          content_text: item.content_text,
        });
      }

      setCreatedBotId(bot.id);
      toast({ title: 'AI Agent created successfully!' });
      setStep(3);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setCreating(false);
  };

  const embedCode = createdBotId
    ? `<!-- Voishper AI Widget -->\n<script>\n(function(){\n  var s=document.createElement('script');\n  s.src='${window.location.origin}/widget.js';\n  s.setAttribute('data-bot-id','${createdBotId}');\n  s.setAttribute('data-host','${window.location.origin}');\n  s.async=true;\n  document.body.appendChild(s);\n})();\n</script>`
    : '';

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast({ title: 'Embed code copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold font-display">Create AI Agent</h1>
          <p className="text-muted-foreground">Build your AI chatbot in 4 simple steps.</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold transition-colors ${
                i < step ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                i === step ? 'bg-primary/20 text-primary border border-primary/30 neon-glow' :
                'bg-muted/50 text-muted-foreground border border-border/50'
              }`}>
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:inline ${i === step ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`w-8 h-px ${i < step ? 'bg-green-500/50' : 'bg-border/50'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 0: Enter Website */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <Card className="glass-panel neon-border">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" /> Scrape Website
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input placeholder="https://your-website.com" value={url} onChange={e => setUrl(e.target.value)} className="bg-muted/50" />
                    <Button onClick={scrapeUrl} disabled={scraping || !url} className="gap-2 shrink-0">
                      {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                      {scraping ? 'Scraping...' : 'Scrape'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`glass-panel transition-colors ${dragOver ? 'border-primary bg-primary/5' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
              >
                <CardContent className="py-8">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">Drag & drop PDF or TXT files here (optional)</p>
                    <label>
                      <input type="file" accept=".txt,.pdf" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
                      <Button variant="outline" size="sm" asChild className="cursor-pointer">
                        <span>{uploading ? 'Uploading...' : 'Browse Files'}</span>
                      </Button>
                    </label>
                  </div>
                </CardContent>
              </Card>

              {scrapedItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{scrapedItems.length} source(s) added</p>
                  {scrapedItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.type === 'url' ? <Globe className="h-4 w-4 text-primary shrink-0" /> : <FileText className="h-4 w-4 text-secondary shrink-0" />}
                        <span className="text-sm truncate">{item.source_name}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button onClick={() => setStep(1)} disabled={scrapedItems.length === 0} className="w-full gap-2">
                Review Data <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* STEP 1: Review Data */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <Card className="glass-panel neon-border">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" /> Review Training Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">Review the data your AI agent will be trained on. Remove anything that shouldn't be included.</p>
                  {scrapedItems.map((item, i) => (
                    <div key={i} className="rounded-lg border border-border/30 overflow-hidden">
                      <div className="flex items-center justify-between p-3 bg-muted/30">
                        <div className="flex items-center gap-2">
                          {item.type === 'url' ? <Globe className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-secondary" />}
                          <span className="text-sm font-medium">{item.source_name}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="p-3 max-h-48 overflow-y-auto">
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {item.content_text.substring(0, 2000)}
                          {item.content_text.length > 2000 && '...'}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button onClick={() => setStep(2)} disabled={scrapedItems.length === 0} className="flex-1 gap-2">
                  Confirm & Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Create Agent */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <Card className="glass-panel neon-border">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> Configure Your Agent
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Agent Name</label>
                    <Input placeholder="e.g. Support Bot" value={botName} onChange={e => setBotName(e.target.value)} className="bg-muted/50" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Greeting Message</label>
                    <Textarea value={greeting} onChange={e => setGreeting(e.target.value)} className="bg-muted/50 min-h-[80px]" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your agent will be trained on {scrapedItems.length} source(s) containing the data you reviewed.
                  </p>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button onClick={createBot} disabled={creating} className="flex-1 gap-2">
                  {creating ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : <><Sparkles className="h-4 w-4" /> Create Agent</>}
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Embed Code */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <Card className="glass-panel neon-border">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" /> Agent Created!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Your AI agent is ready. Copy the embed code below and paste it into your website's HTML, just before the closing <code className="text-primary">&lt;/body&gt;</code> tag.
                  </p>
                  <div className="relative">
                    <pre className="bg-muted/30 border border-border/30 rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap text-muted-foreground leading-relaxed">
                      {embedCode}
                    </pre>
                    <Button
                      size="sm"
                      onClick={copyEmbed}
                      className="absolute top-2 right-2 gap-1"
                      variant={copied ? 'default' : 'outline'}
                    >
                      {copied ? <><CheckCircle2 className="h-3 w-3" /> Copied!</> : <><Copy className="h-3 w-3" /> Copy</>}
                    </Button>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-primary font-medium mb-1">✨ Universal Compatibility</p>
                    <p className="text-xs text-muted-foreground">This code works on WordPress, Shopify, Wix, Squarespace, React, HTML — any website. Just paste and your AI agent goes live!</p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => window.open(`/widget/${createdBotId}`, '_blank')} className="gap-2">
                  <Eye className="h-4 w-4" /> Preview Widget
                </Button>
                <Button onClick={() => { setStep(0); setScrapedItems([]); setCreatedBotId(null); setBotName(''); }} className="flex-1 gap-2" variant="outline">
                  <Sparkles className="h-4 w-4" /> Create Another
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default CreateAgent;
