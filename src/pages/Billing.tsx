import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useUserPlan } from '@/hooks/use-user-plan';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Crown, Zap, Check, Send, Loader2, MessageSquare, Globe, Mic } from 'lucide-react';

const Billing = () => {
  const { user } = useAuth();
  const { plan, loading, freeLimits, remainingScrapes, remainingMessages, refresh } = useUserPlan();
  const { toast } = useToast();
  const [paymentNumber, setPaymentNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitPayment = async () => {
    if (!user || !paymentNumber.trim() || !transactionId.trim()) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('payment_submissions').insert({
        user_id: user.id,
        user_email: user.email || '',
        payment_number: paymentNumber.trim(),
        transaction_id: transactionId.trim(),
        status: 'pending',
      });
      if (error) throw error;
      toast({ title: 'Payment submitted! ✅', description: 'Your plan will be upgraded after admin approval.' });
      setPaymentNumber('');
      setTransactionId('');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const isPremium = plan?.plan_status === 'premium';

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold font-display">Billing & Plans</h1>
          <p className="text-muted-foreground">Manage your subscription and usage.</p>
        </div>

        {/* Current Plan */}
        <Card className="glass-panel neon-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                {isPremium ? <Crown className="h-6 w-6 text-yellow-400" /> : <Zap className="h-6 w-6 text-primary" />}
                <div>
                  <p className="font-bold text-lg">{isPremium ? '👑 Premium Plan' : 'Free Plan'}</p>
                  <p className="text-sm text-muted-foreground">
                    {isPremium ? 'All features unlimited' : 'Limited usage'}
                  </p>
                </div>
              </div>
              {isPremium && <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Active</Badge>}
            </div>
          </CardContent>
        </Card>

        {/* Plans Comparison */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Free Plan */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={`glass-panel h-full ${!isPremium ? 'neon-border' : ''}`}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" /> Free Plan
                </CardTitle>
                <CardDescription>Get started for free</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-4">$0 <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Max {freeLimits.scrapes} website scrape</li>
                  <li className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Max {freeLimits.messages} AI messages / month</li>
                  <li className="flex items-center gap-2 text-muted-foreground"><Mic className="h-4 w-4" /> Voice support (coming soon)</li>
                </ul>
                {!isPremium && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/30 text-xs">
                    <p>Usage: {plan?.scrape_count || 0}/{freeLimits.scrapes} scrapes · {plan?.message_count || 0}/{freeLimits.messages} messages</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Premium Plan */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className={`glass-panel h-full relative overflow-hidden ${isPremium ? 'neon-border' : ''}`}>
              <div className="absolute top-0 right-0 bg-gradient-to-bl from-yellow-500/20 to-transparent w-32 h-32" />
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-400" /> Premium Plan
                </CardTitle>
                <CardDescription>Everything unlimited</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-4">৳500 <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Unlimited website scraping</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Unlimited AI messages</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Voice support (coming soon)</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> Priority support</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Payment Section */}
        {!isPremium && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" /> Make Payment (Nagad)
                </CardTitle>
                <CardDescription>
                  Send 500 BDT to the number below, then fill in the form.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Nagad Personal Number:</p>
                  <p className="text-2xl font-bold font-mono text-primary">01325 117858</p>
                  <p className="text-xs text-muted-foreground mt-1">Send Money → 500 BDT</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Payment Phone Number</label>
                    <Input
                      placeholder="01XXXXXXXXX"
                      value={paymentNumber}
                      onChange={e => setPaymentNumber(e.target.value)}
                      className="bg-muted/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Transaction ID</label>
                    <Input
                      placeholder="XXXXXXXX"
                      value={transactionId}
                      onChange={e => setTransactionId(e.target.value)}
                      className="bg-muted/50"
                    />
                  </div>
                  <Button
                    onClick={submitPayment}
                    disabled={submitting || !paymentNumber || !transactionId}
                    className="w-full gap-2 neon-glow"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {submitting ? 'Submitting...' : 'Submit Payment'}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Your account will be upgraded to Premium after admin review and approval.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Billing;
