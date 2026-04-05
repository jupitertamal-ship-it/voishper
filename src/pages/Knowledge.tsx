import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Globe, FileText, Trash2, Upload, Link, Loader2 } from 'lucide-react';
import { useUserPlan } from '@/hooks/use-user-plan';
import { UpgradeDialog } from '@/components/UpgradeDialog';

type KnowledgeItem = {
  id: string;
  bot_id: string;
  type: string;
  source_name: string;
  content_text: string | null;
  created_at: string;
};

type BotOption = { id: string; name: string };

const Knowledge = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [bots, setBots] = useState<BotOption[]>([]);
  const [selectedBot, setSelectedBot] = useState('');
  const [url, setUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { canScrape, remainingScrapes, plan, refresh: refreshPlan } = useUserPlan();

  useEffect(() => {
    if (!user) return;
    supabase.from('bots').select('id, name').eq('user_id', user.id).then(({ data }) => {
      setBots(data || []);
      if (data && data.length > 0 && !selectedBot) setSelectedBot(data[0].id);
    });
  }, [user]);

  useEffect(() => {
    if (!selectedBot) return;
    supabase.from('knowledge_items').select('*').eq('bot_id', selectedBot).order('created_at', { ascending: false })
      .then(({ data }) => setItems(data || []));
  }, [selectedBot]);

  const scrapeUrl = async () => {
    if (!url || !selectedBot) return;
    if (!canScrape) {
      setShowUpgrade(true);
      return;
    }
    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-url', {
        body: { url, bot_id: selectedBot },
      });
      if (error) throw error;
      toast({ title: 'URL scraped successfully!' });
      setUrl('');
      refreshPlan();
      // Refresh items
      const { data: updated } = await supabase.from('knowledge_items').select('*').eq('bot_id', selectedBot).order('created_at', { ascending: false });
      setItems(updated || []);
    } catch (e: any) {
      toast({ title: 'Scrape failed', description: e.message, variant: 'destructive' });
    }
    setScraping(false);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || !selectedBot) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      if (!file.name.endsWith('.txt') && !file.name.endsWith('.pdf')) {
        toast({ title: 'Unsupported file', description: 'Only .txt and .pdf files are supported.', variant: 'destructive' });
        continue;
      }
      const text = await file.text();
      const { error } = await supabase.from('knowledge_items').insert({
        bot_id: selectedBot,
        type: 'file',
        source_name: file.name,
        content_text: text,
      });
      if (error) {
        toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      }
    }
    toast({ title: 'Files uploaded!' });
    const { data: updated } = await supabase.from('knowledge_items').select('*').eq('bot_id', selectedBot).order('created_at', { ascending: false });
    setItems(updated || []);
    setUploading(false);
  };

  const deleteItem = async (id: string) => {
    await supabase.from('knowledge_items').delete().eq('id', id);
    setItems(items.filter(i => i.id !== id));
    toast({ title: 'Item removed' });
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [selectedBot]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">Ingest data to power your bot's AI responses.</p>
        </div>

        {bots.length === 0 ? (
          <Card className="glass-panel neon-border">
            <CardContent className="py-12 text-center text-muted-foreground">
              Create a bot first before adding knowledge.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex gap-4 items-end flex-wrap">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Select Bot</label>
                <Select value={selectedBot} onValueChange={setSelectedBot}>
                  <SelectTrigger className="w-48 bg-muted/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {bots.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* URL Scraper */}
            <Card className="glass-panel">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Scrape Website</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input placeholder="https://example.com" value={url} onChange={e => setUrl(e.target.value)} className="bg-muted/50" />
                  <Button onClick={scrapeUrl} disabled={scraping || !url} className="gap-2 shrink-0">
                    {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link className="h-4 w-4" />}
                    {scraping ? 'Scraping...' : 'Scrape'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* File Upload Drop Zone */}
            <Card
              className={`glass-panel transition-colors ${dragOver ? 'border-primary bg-primary/5' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <CardContent className="py-8">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">Drag & drop PDF or TXT files here</p>
                  <label>
                    <input type="file" accept=".txt,.pdf" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
                    <Button variant="outline" size="sm" asChild className="cursor-pointer">
                      <span>{uploading ? 'Uploading...' : 'Browse Files'}</span>
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Knowledge Items List */}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Ingested Sources ({items.length})</h2>
              {items.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.type === 'url' ? <Globe className="h-4 w-4 text-primary shrink-0" /> : <FileText className="h-4 w-4 text-secondary shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.source_name}</p>
                        <p className="text-xs text-muted-foreground">{item.type} · {new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteItem(item.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
      <UpgradeDialog open={showUpgrade} onOpenChange={setShowUpgrade} feature="আরো ওয়েবসাইট স্ক্র্যাপিং" />
    </DashboardLayout>
  );
};

export default Knowledge;
