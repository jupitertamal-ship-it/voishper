import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export type UserPlan = {
  plan_status: 'free' | 'premium';
  is_banned: boolean;
  scrape_count: number;
  message_count: number;
  message_reset_date: string;
  isAdmin: boolean;
  bot_count: number;
};

const FREE_LIMITS = { scrapes: 1, messages: 50, bots: 1 };

export function useUserPlan() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPlan = async () => {
    if (!user) { setLoading(false); return; }

    // Fetch plan
    let { data: planData } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Auto-create if missing
    if (!planData) {
      const { data: inserted } = await supabase
        .from('user_plans')
        .insert({ user_id: user.id })
        .select()
        .single();
      planData = inserted;
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    // Count bots owned by user
    const { count: botCount } = await supabase
      .from('bots')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (planData) {
      // Reset monthly message count if needed
      const resetDate = new Date(planData.message_reset_date);
      const now = new Date();
      const needsReset = now.getFullYear() > resetDate.getFullYear() ||
        (now.getFullYear() === resetDate.getFullYear() && now.getMonth() > resetDate.getMonth());

      setPlan({
        plan_status: planData.plan_status as 'free' | 'premium',
        is_banned: planData.is_banned,
        scrape_count: planData.scrape_count,
        message_count: needsReset ? 0 : planData.message_count,
        message_reset_date: planData.message_reset_date,
        isAdmin: roleData?.role === 'admin',
        bot_count: botCount || 0,
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchPlan(); }, [user]);

  const isPremium = plan?.plan_status === 'premium' || !!plan?.isAdmin;
  const canScrape = plan ? (isPremium || plan.scrape_count < FREE_LIMITS.scrapes) : false;
  const canMessage = plan ? (isPremium || plan.message_count < FREE_LIMITS.messages) : false;
  const canCreateBot = plan ? (isPremium || plan.bot_count < FREE_LIMITS.bots) : false;
  const remainingScrapes = plan ? (isPremium ? Infinity : Math.max(0, FREE_LIMITS.scrapes - plan.scrape_count)) : 0;
  const remainingMessages = plan ? (isPremium ? Infinity : Math.max(0, FREE_LIMITS.messages - plan.message_count)) : 0;
  const remainingBots = plan ? (isPremium ? Infinity : Math.max(0, FREE_LIMITS.bots - plan.bot_count)) : 0;

  return {
    plan,
    loading,
    canScrape,
    canMessage,
    canCreateBot,
    remainingScrapes,
    remainingMessages,
    remainingBots,
    freeLimits: FREE_LIMITS,
    refresh: fetchPlan,
  };
}
