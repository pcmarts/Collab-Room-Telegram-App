import { Link, useLocation } from 'wouter';
import { Layout, Users, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Layout },
    { href: '/companies', label: 'Companies', icon: Briefcase },
    { href: '/collaborations', label: 'Collaborations', icon: Users }
  ];

  return (
    <div className="hidden lg:flex h-screen w-64 flex-col fixed left-0 top-0 bottom-0 bg-sidebar border-r">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-sidebar-foreground">CollabRoom</h1>
      </div>
      
      <nav className="flex-1 px-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <a className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md mb-1 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
              location === href && "bg-sidebar-accent text-sidebar-foreground"
            )}>
              <Icon className="h-5 w-5" />
              {label}
            </a>
          </Link>
        ))}
      </nav>
    </div>
  );
}
