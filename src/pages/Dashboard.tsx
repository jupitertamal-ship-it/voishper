import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';
import { Bot, MessageSquare, Users, Sparkles, ArrowRight, Globe, FileText, Clock, Activity, Database, Zap, TrendingUp } from 'lucide-react';

type RecentBot = { id: string; name: string; created_at: string; greeting_message: string | null; website_url: string | null };
type RecentLead = { id: string; name: string; email: string; created_at: string };

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ bots: 0, conversations: 0, leads: 0, knowledgeItems: 0, cacheHits: 0 });
  const [recentBots, setRecentBots] = useState<RecentBot[]>([]);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [apiHealth, setApiHealth] = useState<'active' | 'checking'>('checking');

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const [botsRes, leadsRes, knowledgeRes, convoRes, cacheRes, recentBotsRes, recentLeadsRes] = await Promise.all([
        supabase.from('bots').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('leads').select('id', { count: 'exact' }),
        supabase.from('knowledge_items').select('id', { count: 'exact' }),
        supabase.from('conversations').select('id', { count: 'exact' }),
        supabase.from('cache_responses' as any).select('id', { count: 'exact' }),
        supabase.from('bots').select('id, name, created_at, greeting_message, website_url' as any).eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
        supabase.from('leads').select('id, name, email, created_at').order('created_at', { ascending: false }).limit(5),
      ]);
      setStats({
        bots: botsRes.count || 0,
        conversations: convoRes.count || 0,
        leads: leadsRes.count || 0,
        knowledgeItems: knowledgeRes.count || 0,
        cacheHits: cacheRes.count || 0,
      });
      setRecentBots((recentBotsRes.data as any) || []);
      setRecentLeads(recentLeadsRes.data || []);
      setApiHealth('active');
    };
    fetchAll();
  }, [user]);

  const statCards = [
    { title: 'AI Agents', value: stats.bots, icon: Bot, color: 'text-primary', desc: 'Active chatbots' },
    { title: 'Conversations', value: stats.conversations, icon: MessageSquare, color: 'text-neon-blue', desc: 'Total chats' },
    { title: 'Leads Captured', value: stats.leads, icon: Users, color: 'text-secondary', desc: 'Contact forms' },
    { title: 'Knowledge Items', value: stats.knowledgeItems, icon: FileText, color: 'text-accent', desc: 'Training sources' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display">Dashboard</h1>
            <p className="text-muted-foreground">Your Voishper command center.</p>
          </div>
          <Button onClick={() => navigate('/create-agent')} className="gap-2 neon-glow">
            <Sparkles className="h-4 w-4" /> Create Agent
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card, i) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="glass-panel neon-border hover:border-primary/40 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-1">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{card.title}</CardTitle>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-display">{card.value}</div>
                  <p className="text-[10px] text-muted-foreground mt-1">{card.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* System Health Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="glass-panel">
            <CardContent className="py-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium">API Status:</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${apiHealth === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {apiHealth === 'active' ? '● Active' : '● Checking...'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Cache:</span>
                    <span className="font-medium">{stats.cacheHits} entries</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Model:</span>
                    <span className="font-medium text-primary">Gemini Flash</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>{stats.knowledgeItems} knowledge sources indexed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Agents */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="glass-panel">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Recent Agents</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/bots')} className="text-muted-foreground hover:text-primary gap-1">
                  View All <ArrowRight className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                {recentBots.length === 0 ? (
                  <div className="text-center py-8">
                    <Bot className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">No agents yet</p>
                    <Button size="sm" onClick={() => navigate('/create-agent')} className="gap-1">
                      <Sparkles className="h-3 w-3" /> Create Your First Agent
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentBots.map(bot => (
                      <div key={bot.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/20 hover:border-primary/20 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{bot.name}</p>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {new Date(bot.created_at).toLocaleDateString()}
                              {bot.website_url && <> · <Globe className="h-3 w-3" /> {bot.website_url}</>}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => window.open(`/widget/${bot.id}`, '_blank')} className="text-muted-foreground hover:text-primary shrink-0">
                          <Globe className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Leads */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="glass-panel">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Recent Leads</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/leads')} className="text-muted-foreground hover:text-primary gap-1">
                  View All <ArrowRight className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                {recentLeads.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No leads captured yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Leads appear here when visitors submit their info via your widget.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentLeads.map(lead => (
                      <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/20">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{lead.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{new Date(lead.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Start */}
        {stats.bots === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="glass-panel neon-border overflow-hidden relative">
              <div className="absolute inset-0 plasma-gradient opacity-30" />
              <CardContent className="py-8 relative z-10 text-center">
                <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" style={{ filter: 'drop-shadow(0 0 12px hsl(var(--primary) / 0.5))' }} />
                <h3 className="text-lg font-bold font-display mb-2">Get Started with Voishper AI</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Create your first AI agent in under a minute. Paste your website URL and we'll handle everything.
                </p>
                <Button onClick={() => navigate('/create-agent')} className="gap-2 neon-glow">
                  <Sparkles className="h-4 w-4" /> Create Your First Agent <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
