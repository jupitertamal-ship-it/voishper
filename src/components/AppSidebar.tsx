import { LayoutDashboard, Bot, Sparkles, BarChart3, Settings, LogOut, Mail, CreditCard, Shield } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/lib/auth';
import { useUserPlan } from '@/hooks/use-user-plan';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Create Agent', url: '/create-agent', icon: Sparkles },
  { title: 'My Bots', url: '/bots', icon: Bot },
  { title: 'Leads', url: '/leads', icon: Mail },
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Billing', url: '/billing', icon: CreditCard },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { signOut } = useAuth();
  const { plan } = useUserPlan();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-sidebar">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-3">
            {!collapsed ? (
              <div className="flex items-center gap-2">
                <img src="/images/voishper-logo.png" alt="Voishper" className="h-8 w-8 rounded-lg" />
                <span className="text-lg font-bold text-gradient font-display">Voishper</span>
              </div>
            ) : (
              <img src="/images/voishper-logo.png" alt="V" className="h-7 w-7 rounded-md" />
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/dashboard'}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      activeClassName="bg-primary/10 text-primary neon-border"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && (
                        <span className="flex items-center gap-2">
                          {item.title}
                          {item.url === '/billing' && plan?.plan_status === 'premium' && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 border-yellow-500/30 text-yellow-400">PRO</Badge>
                          )}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {/* Admin link */}
              {plan?.isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/admin"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      activeClassName="bg-primary/10 text-primary neon-border"
                    >
                      <Shield className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
