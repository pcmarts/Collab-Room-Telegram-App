import { Link, useLocation } from 'wouter';
import { Layout, Users, Coffee, Megaphone, User, Building, Search, PlusCircle, ListChecks, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

export function Sidebar() {
  const [location] = useLocation();
  
  // Get user profile data to check admin status
  const { data: profileData } = useQuery({
    queryKey: ['/api/profile'],
    retry: false,
    refetchOnWindowFocus: false,
  });
  
  const isAdmin = profileData?.user?.is_admin || false;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Layout },
    
    // Collaboration section
    { href: '/browse-collaborations', label: 'Browse Collaborations', icon: Search },
    { href: '/create-collaboration', label: 'Create Collaboration', icon: PlusCircle },
    { href: '/my-collaborations', label: 'My Collaborations', icon: ListChecks },
    
    // Original items
    { href: '/collaborations', label: 'Collaborations', icon: Users },
    { href: '/marketing-collabs-new', label: 'Marketing Collabs', icon: Megaphone },
    { href: '/conference-coffees', label: 'Conference Coffees', icon: Coffee },
    { href: '/profile-overview', label: 'Personal Info', icon: User },
    { href: '/company-info', label: 'Company Info', icon: Building }
  ];
  
  // Admin section items - only shown to admin users
  const adminItems = [
    { href: '/admin/users', label: 'Manage Users', icon: Shield }
  ];

  return (
    <div className="hidden lg:flex h-screen w-64 flex-col fixed left-0 top-0 bottom-0 bg-sidebar border-r">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-sidebar-foreground">CollabRoom</h1>
      </div>

      <nav className="flex-1 px-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <span className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md mb-1 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors cursor-pointer",
              location === href && "bg-sidebar-accent text-sidebar-foreground"
            )}>
              <Icon className="h-5 w-5" />
              {label}
            </span>
          </Link>
        ))}
        
        {/* Admin section - only visible to admin users */}
        {isAdmin && (
          <>
            <div className="mt-6 mb-2 px-3">
              <h3 className="text-xs uppercase font-medium text-sidebar-foreground/50">Admin</h3>
            </div>
            {adminItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <span className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md mb-1 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors cursor-pointer",
                  location === href && "bg-sidebar-accent text-sidebar-foreground"
                )}>
                  <Icon className="h-5 w-5" />
                  {label}
                </span>
              </Link>
            ))}
          </>
        )}
      </nav>
    </div>
  );
}