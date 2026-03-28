import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';
import { Bot, MessageSquare, Users, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ bots: 0, conversations: 0, leads: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [botsRes, leadsRes] = await Promise.all([
        supabase.from('bots').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('leads').select('id', { count: 'exact' }),
      ]);
      setStats({
        bots: botsRes.count || 0,
        conversations: 0,
        leads: leadsRes.count || 0,
      });
    };
    fetchStats();
  }, [user]);

  const cards = [
    { title: 'Total Bots', value: stats.bots, icon: Bot, color: 'text-primary' },
    { title: 'Conversations', value: stats.conversations, icon: MessageSquare, color: 'text-secondary' },
    { title: 'Leads Captured', value: stats.leads, icon: Users, color: 'text-green-400' },
    { title: 'Success Rate', value: '—', icon: TrendingUp, color: 'text-amber-400' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground">Here's an overview of your Voishper AI activity.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass-panel neon-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
