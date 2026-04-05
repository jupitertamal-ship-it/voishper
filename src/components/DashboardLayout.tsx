import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { RequireAuth } from '@/lib/auth';
import { BanGuard } from '@/components/BanGuard';
import { Menu } from 'lucide-react';

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <BanGuard>
      <SidebarProvider>
        <div className="min-h-screen flex w-full relative">
          <div className="wave-bg" />
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 flex items-center border-b border-border/50 px-4 glass-panel sticky top-0 z-30">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
            </header>
            <main className="flex-1 p-4 md:p-6 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
      </BanGuard>
    </RequireAuth>
  );
}
