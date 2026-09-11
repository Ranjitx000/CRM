import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/auth.store';
import { cn } from '@/lib/utils';
import { Home, Users, Package, FileText, Settings, LifeBuoy, LogOut, LayoutDashboard } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function Sidebar({ className }: { className?: string }) {
  const { user, logout } = useAuthStore();
  
  if (!user) return null;

  const links = [
    { to: '/', label: 'Dashboard', icon: Home, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
    { to: '/customers', label: 'Customers', icon: Users, roles: ['ADMIN', 'SALES', 'ACCOUNTS'] },
    { to: '/products', label: 'Products', icon: Package, roles: ['ADMIN', 'WAREHOUSE'] },
    { to: '/challans', label: 'Challans', icon: FileText, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
    { to: '/users', label: 'Users', icon: Settings, roles: ['ADMIN'] },
  ];

  const visibleLinks = links.filter((link) => link.roles.includes(user.role));

  return (
    <aside className={cn("flex w-64 flex-col border-r border-border bg-background h-screen sticky top-0 z-40", className)}>
      <div className="h-16 px-6 font-bold text-lg flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
          <LayoutDashboard className="w-4 h-4" />
        </div>
        <span className="tracking-tight">Mini ERP</span>
      </div>
      
      <div className="px-4 py-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
          Menu
        </div>
        <nav className="space-y-1">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <link.icon className={cn("h-4 w-4 transition-transform", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {link.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="px-4 py-2 mt-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
          Support
        </div>
        <nav className="space-y-1">
          <a href="#" className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200">
            <Settings className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
            Settings
          </a>
          <a href="#" className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200">
            <LifeBuoy className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
            Help & Support
          </a>
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center gap-3 rounded-md p-2 hover:bg-muted transition-colors outline-none text-left">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src="" alt={user.name} />
              <AvatarFallback className="bg-primary/5 text-primary text-xs font-medium">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-tight">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.role}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" side="right" sideOffset={8}>
            <DropdownMenuItem>Profile Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              logout();
              window.location.href = '/login';
            }} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
