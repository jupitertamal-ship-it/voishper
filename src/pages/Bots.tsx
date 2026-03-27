import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Plus, Bot, Trash2, Paintbrush, MessageSquare } from 'lucide-react';

type BotType = {
  id: string;
  name: string;
  system_prompt: string | null;
  colors: any;
  greeting_message: string | null;
  created_at: string;
};

const Bots = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bots, setBots] = useState<BotType[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingBot, setEditingBot] = useState<BotType | null>(null);
  const [newBot, setNewBot] = useState({ name: '', system_prompt: '', greeting_message: 'Hi there! 👋 How can I help you today?' });
  const [styleBot, setStyleBot] = useState<BotType | null>(null);
  const [colors, setColors] = useState({ bubble_color: '#00F2FF', header_color: '#6366F1', text_color: '#FFFFFF', font: 'Inter' });

  const fetchBots = async () => {
    if (!user) return;
    const { data } = await supabase.from('bots').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setBots(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchBots(); }, [user]);

  const createBot = async () => {
    if (!user) return;
    setCreating(true);
    const { error } = await supabase.from('bots').insert({
      user_id: user.id,
      name: newBot.name || 'My Bot',
      system_prompt: newBot.system_prompt || null,
      greeting_message: newBot.greeting_message || null,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Bot created!' });
      setNewBot({ name: '', system_prompt: '', greeting_message: 'Hi there! 👋 How can I help you today?' });
      fetchBots();
    }
    setCreating(false);
  };

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
    if (!error) {
      toast({ title: 'Styles updated!' });
      fetchBots();
      setStyleBot(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Bots</h1>
            <p className="text-muted-foreground">Create and manage your AI chatbots.</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> New Bot
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel border-border/50">
              <DialogHeader>
                <DialogTitle>Create a New Bot</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Bot name" value={newBot.name} onChange={e => setNewBot({ ...newBot, name: e.target.value })} className="bg-muted/50" />
                <Textarea placeholder="System prompt (instructions for your bot)" value={newBot.system_prompt} onChange={e => setNewBot({ ...newBot, system_prompt: e.target.value })} className="bg-muted/50 min-h-[100px]" />
                <Input placeholder="Greeting message" value={newBot.greeting_message} onChange={e => setNewBot({ ...newBot, greeting_message: e.target.value })} className="bg-muted/50" />
                <Button onClick={createBot} disabled={creating} className="w-full">
                  {creating ? 'Creating...' : 'Create Bot'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : bots.length === 0 ? (
          <Card className="glass-panel neon-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bot className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No bots yet. Create your first one!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bots.map((bot, i) => (
              <motion.div key={bot.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="glass-panel neon-border group">
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: bot.colors?.bubble_color || '#00F2FF' }}>
                        <MessageSquare className="h-5 w-5" style={{ color: bot.colors?.text_color || '#fff' }} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{bot.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(bot.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {bot.greeting_message || 'No greeting set'}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => {
                          setStyleBot(bot);
                          setColors(bot.colors || { bubble_color: '#00F2FF', header_color: '#6366F1', text_color: '#FFFFFF', font: 'Inter' });
                        }}
                      >
                        <Paintbrush className="h-3 w-3" /> Style
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteBot(bot.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Style Editor Dialog */}
        <Dialog open={!!styleBot} onOpenChange={(open) => !open && setStyleBot(null)}>
          <DialogContent className="glass-panel border-border/50 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Style Editor — {styleBot?.name}</DialogTitle>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Bubble Color</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={colors.bubble_color} onChange={e => setColors({ ...colors, bubble_color: e.target.value })} className="h-10 w-10 rounded cursor-pointer" />
                    <Input value={colors.bubble_color} onChange={e => setColors({ ...colors, bubble_color: e.target.value })} className="bg-muted/50" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Header Color</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={colors.header_color} onChange={e => setColors({ ...colors, header_color: e.target.value })} className="h-10 w-10 rounded cursor-pointer" />
                    <Input value={colors.header_color} onChange={e => setColors({ ...colors, header_color: e.target.value })} className="bg-muted/50" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Text Color</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={colors.text_color} onChange={e => setColors({ ...colors, text_color: e.target.value })} className="h-10 w-10 rounded cursor-pointer" />
                    <Input value={colors.text_color} onChange={e => setColors({ ...colors, text_color: e.target.value })} className="bg-muted/50" />
                  </div>
                </div>
                <Button onClick={updateBotColors} className="w-full">Save Styles</Button>
              </div>
              {/* Live Preview */}
              <div className="flex flex-col items-center justify-center">
                <p className="text-sm text-muted-foreground mb-3">Live Preview</p>
                <div className="relative">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-lg"
                    style={{ backgroundColor: colors.bubble_color, boxShadow: `0 0 20px ${colors.bubble_color}40` }}
                  >
                    <MessageSquare className="h-6 w-6" style={{ color: colors.text_color }} />
                  </div>
                  <div className="mt-4 w-72 rounded-xl overflow-hidden border border-border/50 shadow-xl">
                    <div className="p-4 flex items-center gap-2" style={{ backgroundColor: colors.header_color }}>
                      <MessageSquare className="h-5 w-5" style={{ color: colors.text_color }} />
                      <span className="font-medium text-sm" style={{ color: colors.text_color }}>{styleBot?.name}</span>
                    </div>
                    <div className="bg-card p-4 min-h-[120px]">
                      <div className="rounded-lg p-3 text-sm max-w-[80%]" style={{ backgroundColor: colors.bubble_color + '20', color: 'hsl(var(--foreground))' }}>
                        {styleBot?.greeting_message || 'Hello!'}
                      </div>
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
