import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';
import { Search, Download, Mail, User, MessageSquare, Eye } from 'lucide-react';

type Lead = {
  id: string;
  bot_id: string;
  name: string;
  email: string;
  chat_transcript: string | null;
  created_at: string;
  bot_name?: string;
};

const Leads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [bots, setBots] = useState<{ id: string; name: string }[]>([]);
  const [selectedBot, setSelectedBot] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('bots').select('id, name').eq('user_id', user.id).then(({ data }) => {
      setBots(data || []);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchLeads = async () => {
      setLoading(true);
      // Get user's bot ids first
      const { data: userBots } = await supabase.from('bots').select('id, name').eq('user_id', user.id);
      if (!userBots || userBots.length === 0) {
        setLeads([]);
        setLoading(false);
        return;
      }
      const botMap = Object.fromEntries(userBots.map(b => [b.id, b.name]));
      const botIds = userBots.map(b => b.id);

      let query = supabase.from('leads').select('*').in('bot_id', botIds).order('created_at', { ascending: false });
      if (selectedBot !== 'all') {
        query = query.eq('bot_id', selectedBot);
      }
      const { data } = await query;
      setLeads((data || []).map(l => ({ ...l, bot_name: botMap[l.bot_id] || 'Unknown' })));
      setLoading(false);
    };
    fetchLeads();
  }, [user, selectedBot]);

  const filtered = leads.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.email.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Bot', 'Date', 'Transcript'];
    const rows = filtered.map(l => [
      l.name,
      l.email,
      l.bot_name || '',
      new Date(l.created_at).toLocaleDateString(),
      (l.chat_transcript || '').replace(/\n/g, ' '),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Leads</h1>
            <p className="text-muted-foreground">View and manage captured leads from your bots.</p>
          </div>
          <Button variant="outline" onClick={exportCSV} className="gap-2" disabled={filtered.length === 0}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-muted/50"
            />
          </div>
          <Select value={selectedBot} onValueChange={setSelectedBot}>
            <SelectTrigger className="w-48 bg-muted/50"><SelectValue placeholder="All Bots" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bots</SelectItem>
              {bots.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="glass-panel neon-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No leads captured yet.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Bot</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((lead, i) => (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-border/20 hover:bg-muted/20"
                    >
                      <TableCell className="font-medium flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {lead.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{lead.email}</TableCell>
                      <TableCell>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{lead.bot_name}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {lead.chat_transcript && (
                          <Button variant="ghost" size="sm" onClick={() => setViewingLead(lead)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* Transcript Dialog */}
        <Dialog open={!!viewingLead} onOpenChange={(open) => !open && setViewingLead(null)}>
          <DialogContent className="glass-panel border-border/50 max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Chat Transcript — {viewingLead?.name}
              </DialogTitle>
            </DialogHeader>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/20 rounded-lg p-4 border border-border/30">
              {viewingLead?.chat_transcript || 'No transcript available.'}
            </pre>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Leads;
