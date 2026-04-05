import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useUserPlan } from '@/hooks/use-user-plan';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, CreditCard, Ban, Crown, Check, Loader2 } from 'lucide-react';

type AdminUser = {
  id: string;
  email: string;
  created_at: string;
  plan_status: string;
  is_banned: boolean;
  scrape_count: number;
  message_count: number;
};

type Payment = {
  id: string;
  user_id: string;
  user_email: string;
  payment_number: string;
  transaction_id: string;
  status: string;
  created_at: string;
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const { plan, loading: planLoading } = useUserPlan();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    if (!planLoading && (!plan || !plan.isAdmin)) {
      navigate('/dashboard');
    }
  }, [plan, planLoading, navigate]);

  useEffect(() => {
    if (plan?.isAdmin) {
      fetchUsers();
      fetchPayments();
    }
  }, [plan]);

  const adminAction = async (action: string, params: Record<string, any> = {}) => {
    const { data, error } = await supabase.functions.invoke('admin-actions', {
      body: { action, ...params },
    });
    if (error) throw error;
    return data;
  };

  const fetchUsers = async () => {
    try {
      const data = await adminAction('list_users');
      setUsers(data.users || []);
    } catch (e: any) {
      toast({ title: 'Error loading users', description: e.message, variant: 'destructive' });
    }
  };

  const fetchPayments = async () => {
    try {
      const data = await adminAction('list_payments');
      setPayments(data.payments || []);
    } catch (e: any) {
      toast({ title: 'Error loading payments', description: e.message, variant: 'destructive' });
    }
  };

  const toggleBan = async (userId: string, currentBan: boolean) => {
    setLoadingAction(`ban-${userId}`);
    try {
      await adminAction('toggle_ban', { user_id: userId, is_banned: !currentBan });
      toast({ title: currentBan ? 'User unbanned' : 'User banned' });
      fetchUsers();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setLoadingAction(null);
  };

  const togglePlan = async (userId: string, currentPlan: string) => {
    setLoadingAction(`plan-${userId}`);
    const newPlan = currentPlan === 'premium' ? 'free' : 'premium';
    try {
      await adminAction('update_plan', { user_id: userId, plan_status: newPlan });
      toast({ title: `Plan updated to ${newPlan}` });
      fetchUsers();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setLoadingAction(null);
  };

  const approvePayment = async (paymentId: string) => {
    setLoadingAction(`pay-${paymentId}`);
    try {
      await adminAction('approve_payment', { payment_id: paymentId });
      toast({ title: 'Payment approved & user upgraded!' });
      fetchPayments();
      fetchUsers();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setLoadingAction(null);
  };

  if (planLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!plan?.isAdmin) return null;

  const pendingPayments = payments.filter(p => p.status === 'pending');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold font-display">Super Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, payments, and platform settings.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="glass-panel neon-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{users.length}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-panel neon-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-2xl font-bold">{users.filter(u => u.plan_status === 'premium').length}</p>
                  <p className="text-xs text-muted-foreground">Premium Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-panel neon-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-2xl font-bold">{pendingPayments.length}</p>
                  <p className="text-xs text-muted-foreground">Pending Payments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
            <TabsTrigger value="payments">
              Payments
              {pendingPayments.length > 0 && (
                <Badge variant="destructive" className="ml-2 text-[10px] px-1.5">{pendingPayments.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="glass-panel">
              <CardContent className="pt-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(u => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium text-sm">{u.email}</TableCell>
                          <TableCell>
                            <Badge variant={u.plan_status === 'premium' ? 'default' : 'secondary'} className="text-[10px]">
                              {u.plan_status === 'premium' ? '👑 Premium' : 'Free'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.is_banned ? 'destructive' : 'outline'} className="text-[10px]">
                              {u.is_banned ? '🚫 Banned' : '✅ Active'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {u.scrape_count} scrapes · {u.message_count} msgs
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => togglePlan(u.id, u.plan_status)}
                                disabled={loadingAction === `plan-${u.id}`}
                                className="text-xs h-7"
                              >
                                {loadingAction === `plan-${u.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> :
                                  u.plan_status === 'premium' ? 'Downgrade' : 'Upgrade'}
                              </Button>
                              <Button
                                variant={u.is_banned ? 'default' : 'destructive'}
                                size="sm"
                                onClick={() => toggleBan(u.id, u.is_banned)}
                                disabled={loadingAction === `ban-${u.id}`}
                                className="text-xs h-7"
                              >
                                {loadingAction === `ban-${u.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> :
                                  u.is_banned ? 'Unban' : 'Ban'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-base">Payment Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="text-sm">{p.user_email}</TableCell>
                          <TableCell className="text-sm">{p.payment_number}</TableCell>
                          <TableCell className="text-sm font-mono">{p.transaction_id}</TableCell>
                          <TableCell>
                            <Badge variant={p.status === 'approved' ? 'default' : p.status === 'pending' ? 'secondary' : 'destructive'} className="text-[10px]">
                              {p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(p.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {p.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => approvePayment(p.id)}
                                disabled={loadingAction === `pay-${p.id}`}
                                className="text-xs h-7 gap-1"
                              >
                                {loadingAction === `pay-${p.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                Approve
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {payments.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No payment submissions yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
