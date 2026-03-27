import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, MessageSquare, Users, TrendingUp } from 'lucide-react';

const Analytics = () => {
  const { user } = useAuth();
  const [bots, setBots] = useState<{ id: string; name: string }[]>([]);
  const [selectedBot, setSelectedBot] = useState('');
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('bots').select('id, name').eq('user_id', user.id).then(({ data }) => {
      setBots(data || []);
      if (data && data.length > 0) setSelectedBot(data[0].id);
    });
  }, [user]);

  useEffect(() => {
    if (!selectedBot) return;
    supabase.from('analytics').select('*').eq('bot_id', selectedBot).order('date', { ascending: true }).limit(30)
      .then(({ data }) => setData(data || []));
  }, [selectedBot]);

  const totalConversations = data.reduce((a, d) => a + (d.total_conversations || 0), 0);
  const totalLeads = data.reduce((a, d) => a + (d.leads_captured || 0), 0);
  const avgSuccess = data.length ? (data.reduce((a, d) => a + Number(d.bot_success_rate || 0), 0) / data.length).toFixed(1) : '0';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Track your bot performance and engagement.</p>
          </div>
          {bots.length > 0 && (
            <Select value={selectedBot} onValueChange={setSelectedBot}>
              <SelectTrigger className="w-48 bg-muted/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {bots.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Total Conversations', value: totalConversations, icon: MessageSquare, color: 'text-primary' },
            { label: 'Leads Captured', value: totalLeads, icon: Users, color: 'text-green-400' },
            { label: 'Avg Success Rate', value: `${avgSuccess}%`, icon: TrendingUp, color: 'text-amber-400' },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="glass-panel neon-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm text-muted-foreground">{card.label}</CardTitle>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="glass-panel">
            <CardHeader><CardTitle className="text-base">Conversations Over Time</CardTitle></CardHeader>
            <CardContent className="h-64">
              {data.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Line type="monotone" dataKey="total_conversations" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader><CardTitle className="text-base">Leads Captured</CardTitle></CardHeader>
            <CardContent className="h-64">
              {data.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Bar dataKey="leads_captured" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
