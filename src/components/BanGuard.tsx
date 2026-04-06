import { ReactNode } from 'react';
import { useUserPlan } from '@/hooks/use-user-plan';
import { Shield } from 'lucide-react';

export function BanGuard({ children }: { children: ReactNode }) {
  const { plan, loading } = useUserPlan();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (plan?.is_banned) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md p-8">
          <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Account Suspended</h1>
          <p className="text-muted-foreground">
            Your account has been suspended. Please contact support for assistance.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
