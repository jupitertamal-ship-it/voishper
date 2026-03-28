import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Copy, User, Code } from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [bots, setBots] = useState<{ id: string; name: string }[]>([]);
  const [selectedBot, setSelectedBot] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('display_name').eq('user_id', user.id).single()
      .then(({ data }) => { if (data) setDisplayName(data.display_name || ''); });
    supabase.from('bots').select('id, name').eq('user_id', user.id)
      .then(({ data }) => {
        setBots(data || []);
        if (data && data.length > 0) setSelectedBot(data[0].id);
      });
  }, [user]);

  const updateProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ display_name: displayName }).eq('user_id', user.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated!' });
    }
  };

  const embedCode = selectedBot
    ? `<!-- Voishper Widget -->\n<script src="${window.location.origin}/widget.js" data-bot-id="${selectedBot}"></script>`
    : 'Select a bot to generate embed code';

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    toast({ title: 'Copied to clipboard!' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your profile and embed configuration.</p>
        </div>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Email</label>
              <Input value={user?.email || ''} disabled className="bg-muted/30" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Display Name</label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="bg-muted/50" />
            </div>
            <Button onClick={updateProfile}>Save Profile</Button>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Code className="h-4 w-4 text-secondary" /> Embed Code</CardTitle>
            <CardDescription>Copy and paste this snippet into your website's HTML.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {bots.length > 0 && (
              <Select value={selectedBot} onValueChange={setSelectedBot}>
                <SelectTrigger className="w-48 bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {bots.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <div className="relative">
              <pre className="bg-muted/30 p-4 rounded-lg text-xs overflow-x-auto border border-border/30">
                {embedCode}
              </pre>
              <Button variant="outline" size="sm" className="absolute top-2 right-2 gap-1" onClick={copyEmbed}>
                <Copy className="h-3 w-3" /> Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
