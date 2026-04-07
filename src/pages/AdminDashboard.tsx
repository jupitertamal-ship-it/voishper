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
import { Shield, Users, CreditCard, Crown, Check, Loader2, KeyRound } from 'lucide-react';

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

type ResetRequest = {
  id: string;
  user_id: string;
  user_email: string;
  status: string;
  admin_note: string | null;
  created_at: string;
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const { plan, loading: planLoading } = useUserPlan();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [resetRequests, setResetRequests] = useState<ResetRequest[]>([]);
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
      fetchResetRequests();
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

  const fetchResetRequests = async () => {
    try {
      const data = await adminAction('list_reset_requests');
      setResetRequests(data.requests || []);
    } catch (e: any) {
      console.error('Error loading reset requests', e);
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

  const handleResetRequest = async (requestId: string, action: 'approve' | 'deny') => {
    setLoadingAction(`reset-${requestId}`);
    try {
      await adminAction('handle_reset_request', { request_id: requestId, decision: action });
      toast({ title: action === 'approve' ? 'Reset link sent to user' : 'Request denied' });
      fetchResetRequests();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setLoadingAction(null);
  };

  const forceSignOutAll = async () => {
    if (!confirm('Are you sure you want to sign out ALL users? Everyone will need to log in again.')) return;
    setLoadingAction('signout-all');
    try {
      await adminAction('force_signout_all');
      toast({ title: 'All users signed out!', description: 'Everyone must re-authenticate.' });
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
  const pendingResets = resetRequests.filter(r => r.status === 'pending');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold font-display">Super Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, payments, and platform settings.</p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={forceSignOutAll}
            disabled={loadingAction === 'signout-all'}
            className="text-xs h-8 gap-1"
          >
            {loadingAction === 'signout-all' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3" />}
            Force Sign Out All
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
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
          <Card className="glass-panel neon-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <KeyRound className="h-5 w-5 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold">{pendingResets.length}</p>
                  <p className="text-xs text-muted-foreground">Reset Requests</p>
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
            <TabsTrigger value="resets">
              Resets
              {pendingResets.length > 0 && (
                <Badge variant="destructive" className="ml-2 text-[10px] px-1.5">{pendingResets.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="glass-panel">
              <CardContent className="pt-4">
                <div className="overflow-x-auto -mx-4 px-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Email</TableHead>
                        <TableHead className="min-w-[100px]">Plan</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                        <TableHead className="min-w-[140px]">Usage</TableHead>
                        <TableHead className="min-w-[160px]">Actions</TableHead>
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
                <div className="overflow-x-auto -mx-4 px-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[180px]">Email</TableHead>
                        <TableHead className="min-w-[120px]">Phone</TableHead>
                        <TableHead className="min-w-[120px]">Transaction ID</TableHead>
                        <TableHead className="min-w-[90px]">Status</TableHead>
                        <TableHead className="min-w-[100px]">Date</TableHead>
                        <TableHead className="min-w-[90px]">Action</TableHead>
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

          <TabsContent value="resets">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" /> Password Reset Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-4 px-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Email</TableHead>
                        <TableHead className="min-w-[90px]">Status</TableHead>
                        <TableHead className="min-w-[100px]">Date</TableHead>
                        <TableHead className="min-w-[160px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resetRequests.map(r => (
                        <TableRow key={r.id}>
                          <TableCell className="text-sm">{r.user_email}</TableCell>
                          <TableCell>
                            <Badge variant={r.status === 'approved' ? 'default' : r.status === 'pending' ? 'secondary' : 'destructive'} className="text-[10px]">
                              {r.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {r.status === 'pending' && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleResetRequest(r.id, 'approve')}
                                  disabled={loadingAction === `reset-${r.id}`}
                                  className="text-xs h-7 gap-1"
                                >
                                  {loadingAction === `reset-${r.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleResetRequest(r.id, 'deny')}
                                  disabled={loadingAction === `reset-${r.id}`}
                                  className="text-xs h-7"
                                >
                                  Deny
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {resetRequests.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No reset requests yet.
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
