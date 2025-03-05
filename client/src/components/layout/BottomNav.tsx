import { Link, useLocation } from 'wouter';
import { Home, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/collaborations', label: 'Discover', icon: Users },
    { href: '/active-collabs', label: 'Active', icon: Clock }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t">
      <nav className="flex justify-around items-center h-16">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <a className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground",
              location === href && "text-primary"
            )}>
              <Icon className="h-5 w-5" />
              <span className="text-xs">{label}</span>
            </a>
          </Link>
        ))}
      </nav>
    </div>
  );
}
