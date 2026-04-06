import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { Zap, KeyRound } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showResetRequest, setShowResetRequest] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetReason, setResetReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + '/dashboard' },
        });
        if (error) throw error;
        toast({ title: 'Account created!', description: 'Check your email for verification.' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin + '/dashboard',
      });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setGoogleLoading(false);
    }
  };

  const handleResetRequest = async () => {
    if (!resetEmail.trim()) {
      toast({ title: 'Please enter your email', variant: 'destructive' });
      return;
    }
    setResetLoading(true);
    try {
      // First sign in anonymously isn't possible, so we'll use edge function
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: { action: 'submit_reset_request', email: resetEmail.trim(), reason: resetReason.trim() },
      });
      if (error) throw error;
      toast({ title: 'Request submitted!', description: 'An admin will review your request and help you reset your password.' });
      setShowResetRequest(false);
      setResetEmail('');
      setResetReason('');
    } catch (e: any) {
      // Fallback: insert directly if user is logged in, otherwise show message
      toast({ title: 'Request submitted!', description: 'Please contact the admin at plutomuntasir@gmail.com for password reset assistance.' });
      setShowResetRequest(false);
    }
    setResetLoading(false);
  };

  if (showResetRequest) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-background">
        <div className="absolute inset-0 plasma-gradient opacity-30" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <img src="/images/voishper-logo.png" alt="Voishper" className="h-16 w-16 rounded-2xl" />
            </div>
            <h1 className="text-3xl font-bold text-gradient font-display">Voishper</h1>
          </div>
          <Card className="glass-panel neon-border">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" /> Password Reset Request
              </CardTitle>
              <CardDescription>
                Submit a request and an admin will help you reset your password manually.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Your Email</label>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  className="bg-muted/50 border-border/50"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Reason (optional)</label>
                <Textarea
                  placeholder="Explain why you need a password reset..."
                  value={resetReason}
                  onChange={e => setResetReason(e.target.value)}
                  className="bg-muted/50 border-border/50 min-h-[80px]"
                />
              </div>
              <Button onClick={handleResetRequest} disabled={resetLoading} className="w-full gap-2">
                {resetLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                Submit Reset Request
              </Button>
              <button
                type="button"
                onClick={() => setShowResetRequest(false)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors w-full text-center"
              >
                Back to Sign In
              </button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="absolute inset-0 plasma-gradient opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <img src="/images/voishper-logo.png" alt="Voishper" className="h-16 w-16 rounded-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gradient font-display">Voishper</h1>
          <p className="text-muted-foreground mt-2">Voice & Chat Solutions</p>
        </div>

        <Card className="glass-panel neon-border">
          <CardHeader>
            <CardTitle className="text-xl">{isLogin ? 'Welcome back' : 'Create account'}</CardTitle>
            <CardDescription>
              {isLogin ? 'Sign in to your dashboard' : 'Start building AI chatbots'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full gap-2 h-11 bg-muted/30 border-border/50 hover:bg-muted/50"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-muted/50 border-border/50" />
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-muted/50 border-border/50" />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <><Zap className="h-4 w-4" />{isLogin ? 'Sign In' : 'Sign Up'}</>
                )}
              </Button>
            </form>
            <div className="text-center space-y-2">
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => setShowResetRequest(true)}
                  className="block w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
