import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Bot, Trash2, Paintbrush, MessageSquare, Globe, Sparkles, Copy, CheckCircle2, Settings2, Phone, Shield, Eye } from 'lucide-react';

type BotType = {
  id: string;
  name: string;
  system_prompt: string | null;
  colors: any;
  greeting_message: string | null;
  created_at: string;
  website_url: string | null;
  whatsapp_number: string | null;
  domain_whitelist: string[] | null;
};

const Bots = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [bots, setBots] = useState<BotType[]>([]);
  const [loading, setLoading] = useState(true);
  const [styleBot, setStyleBot] = useState<BotType | null>(null);
  const [colors, setColors] = useState({ bubble_color: '#00F2FF', header_color: '#6366F1', text_color: '#FFFFFF', font: 'Inter' });
  const [editBot, setEditBot] = useState<BotType | null>(null);
  const [editFields, setEditFields] = useState({ name: '', system_prompt: '', greeting_message: '', whatsapp_number: '', domain_whitelist: '' });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchBots = async () => {
    if (!user) return;
    const { data } = await supabase.from('bots').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setBots((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchBots(); }, [user]);

  const deleteBot = async (id: string) => {
    const { error } = await supabase.from('bots').delete().eq('id', id);
    if (!error) {
      setBots(bots.filter(b => b.id !== id));
      toast({ title: 'Bot deleted' });
    }
  };

  const updateBotColors = async () => {
    if (!styleBot) return;
    const { error } = await supabase.from('bots').update({ colors }).eq('id', styleBot.id);
    if (!error) { toast({ title: 'Styles updated!' }); fetchBots(); setStyleBot(null); }
  };

  const openEdit = (bot: BotType) => {
    setEditBot(bot);
    setEditFields({
      name: bot.name,
      system_prompt: bot.system_prompt || '',
      greeting_message: bot.greeting_message || '',
      whatsapp_number: bot.whatsapp_number || '',
      domain_whitelist: (bot.domain_whitelist || []).join(', '),
    });
  };

  const saveEdit = async () => {
    if (!editBot) return;
    const domains = editFields.domain_whitelist.split(',').map(d => d.trim()).filter(Boolean);
    const { error } = await supabase.from('bots').update({
      name: editFields.name,
      system_prompt: editFields.system_prompt || null,
      greeting_message: editFields.greeting_message || null,
      whatsapp_number: editFields.whatsapp_number || null,
      domain_whitelist: domains,
    } as any).eq('id', editBot.id);
    if (!error) { toast({ title: 'Bot updated!' }); fetchBots(); setEditBot(null); }
  };

  const copyEmbed = (botId: string) => {
    const code = `<script>\n(function(){\n  var s=document.createElement('script');\n  s.src='${window.location.origin}/widget.js';\n  s.setAttribute('data-bot-id','${botId}');\n  s.setAttribute('data-host','${window.location.origin}');\n  s.async=true;\n  document.body.appendChild(s);\n})();\n</script>`;
    navigator.clipboard.writeText(code);
    setCopiedId(botId);
    toast({ title: 'Embed code copied!' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">My Agents</h1>
            <p className="text-muted-foreground">Manage your AI chatbots.</p>
          </div>
          <Button onClick={() => navigate('/create-agent')} className="gap-2">
            <Sparkles className="h-4 w-4" /> Create Agent
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : bots.length === 0 ? (
          <Card className="glass-panel neon-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bot className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-3">No agents yet. Create your first one!</p>
              <Button onClick={() => navigate('/create-agent')} className="gap-2"><Sparkles className="h-4 w-4" /> Create Agent</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bots.map((bot, i) => (
              <motion.div key={bot.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="glass-panel neon-border group">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: bot.colors?.bubble_color || '#00F2FF' }}>
                        <MessageSquare className="h-5 w-5" style={{ color: bot.colors?.text_color || '#fff' }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base truncate">{bot.name}</CardTitle>
                        <p className="text-[10px] text-muted-foreground">{new Date(bot.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">{bot.greeting_message || 'No greeting set'}</p>
                    {bot.website_url && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Globe className="h-3 w-3" /> {bot.website_url}
                      </div>
                    )}
                    <div className="flex items-center gap-1 flex-wrap">
                      {bot.whatsapp_number && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> WhatsApp</span>
                      )}
                      {(bot.domain_whitelist?.length || 0) > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 flex items-center gap-1"><Shield className="h-2.5 w-2.5" /> Secured</span>
                      )}
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs h-8" onClick={() => openEdit(bot)}>
                        <Settings2 className="h-3 w-3" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1 text-xs h-8" onClick={() => { setStyleBot(bot); setColors(bot.colors || { bubble_color: '#00F2FF', header_color: '#6366F1', text_color: '#FFFFFF', font: 'Inter' }); }}>
                        <Paintbrush className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1 text-xs h-8" onClick={() => copyEmbed(bot.id)}>
                        {copiedId === bot.id ? <CheckCircle2 className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1 text-xs h-8" onClick={() => window.open(`/widget/${bot.id}`, '_blank')}>
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteBot(bot.id)} className="text-destructive hover:text-destructive h-8">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editBot} onOpenChange={open => !open && setEditBot(null)}>
          <DialogContent className="glass-panel border-border/50">
            <DialogHeader><DialogTitle>Edit — {editBot?.name}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><label className="text-sm text-muted-foreground block mb-1">Name</label><Input value={editFields.name} onChange={e => setEditFields({ ...editFields, name: e.target.value })} className="bg-muted/50" /></div>
              <div><label className="text-sm text-muted-foreground block mb-1">Greeting</label><Input value={editFields.greeting_message} onChange={e => setEditFields({ ...editFields, greeting_message: e.target.value })} className="bg-muted/50" /></div>
              <div><label className="text-sm text-muted-foreground block mb-1">System Prompt</label><Textarea value={editFields.system_prompt} onChange={e => setEditFields({ ...editFields, system_prompt: e.target.value })} className="bg-muted/50 min-h-[80px]" /></div>
              <div><label className="text-sm text-muted-foreground block mb-1">WhatsApp Number</label><Input value={editFields.whatsapp_number} onChange={e => setEditFields({ ...editFields, whatsapp_number: e.target.value })} className="bg-muted/50" placeholder="+880XXXXXXXXXX" /></div>
              <div><label className="text-sm text-muted-foreground block mb-1">Domain Whitelist</label><Input value={editFields.domain_whitelist} onChange={e => setEditFields({ ...editFields, domain_whitelist: e.target.value })} className="bg-muted/50" placeholder="example.com, shop.example.com" /></div>
              <Button onClick={saveEdit} className="w-full">Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Style Dialog */}
        <Dialog open={!!styleBot} onOpenChange={open => !open && setStyleBot(null)}>
          <DialogContent className="glass-panel border-border/50 max-w-2xl">
            <DialogHeader><DialogTitle>Style Editor — {styleBot?.name}</DialogTitle></DialogHeader>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {[{ key: 'bubble_color', label: 'Bubble Color' }, { key: 'header_color', label: 'Header Color' }, { key: 'text_color', label: 'Text Color' }].map(c => (
                  <div key={c.key}>
                    <label className="text-sm text-muted-foreground mb-1 block">{c.label}</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={(colors as any)[c.key]} onChange={e => setColors({ ...colors, [c.key]: e.target.value })} className="h-10 w-10 rounded cursor-pointer" />
                      <Input value={(colors as any)[c.key]} onChange={e => setColors({ ...colors, [c.key]: e.target.value })} className="bg-muted/50" />
                    </div>
                  </div>
                ))}
                <Button onClick={updateBotColors} className="w-full">Save Styles</Button>
              </div>
              <div className="flex flex-col items-center justify-center">
                <p className="text-sm text-muted-foreground mb-3">Live Preview</p>
                <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg mb-4" style={{ backgroundColor: colors.bubble_color, boxShadow: `0 0 20px ${colors.bubble_color}40` }}>
                  <MessageSquare className="h-6 w-6" style={{ color: colors.text_color }} />
                </div>
                <div className="w-72 rounded-xl overflow-hidden border border-border/50 shadow-xl">
                  <div className="p-4 flex items-center gap-2" style={{ backgroundColor: colors.header_color }}>
                    <MessageSquare className="h-5 w-5" style={{ color: colors.text_color }} />
                    <span className="font-medium text-sm" style={{ color: colors.text_color }}>{styleBot?.name}</span>
                  </div>
                  <div className="bg-card p-4 min-h-[100px]">
                    <div className="rounded-lg p-3 text-sm max-w-[80%]" style={{ backgroundColor: colors.bubble_color + '20', color: 'hsl(var(--foreground))' }}>
                      {styleBot?.greeting_message || 'Hello!'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Bots;
