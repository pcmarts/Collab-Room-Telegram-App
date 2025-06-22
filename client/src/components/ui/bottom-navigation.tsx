import { useState, useEffect } from "react"
import { Link, useLocation } from "wouter"
import { User, MessageSquare, FolderPlus, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { DiscoveryIcon } from "@/components/icons/DiscoveryIcon"
import { Badge } from "@/components/ui/badge"
import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"

const BottomNavigation = () => {
  const [location] = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await apiRequest('/api/profile');
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);
  
  // Fetch actual matches count from API (only if authenticated)
  const { data: matches } = useQuery({
    queryKey: ['/api/matches'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/matches');
        return response || [];
      } catch (error) {
        console.error('Error fetching matches:', error);
        return [];
      }
    },
    enabled: isAuthenticated,
    // Optimize to reduce network requests
    staleTime: 5 * 60 * 1000, // 5 minutes - matches don't change frequently enough to need faster updates
    refetchOnWindowFocus: false, // Don't refetch when window gets focus
    refetchInterval: false, // Don't automatically refresh
    retry: 1, // Only retry once on failure
  });

  // Calculate actual matches count
  const matchesCount = matches && matches.length > 0 ? matches.length : 0;

  const navItems = [
    {
      label: "Discover",
      icon: DiscoveryIcon,
      href: "/discover",
      requiresAuth: false,
    },
    {
      label: "My Collabs",
      icon: FolderPlus,
      href: "/my-collaborations",
      requiresAuth: true,
    },
    {
      label: "My Account",
      icon: User,
      href: "/dashboard",
      requiresAuth: true,
    },
    {
      label: "My Matches",
      icon: MessageSquare,
      href: "/matches",
      requiresAuth: true,
      notificationCount: matchesCount > 0 ? matchesCount : null
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full h-24 bg-background border-t border-border pb-6">
      <div className="grid h-full grid-cols-4 mx-auto">
        {navItems.map((item) => {
          const isRestricted = item.requiresAuth && !isAuthenticated;
          const isActive = location === item.href;
          
          if (isRestricted) {
            // Render as disabled for unauthenticated users
            return (
              <div
                key={item.href}
                className={cn(
                  "flex flex-col items-center justify-center px-1 pt-2 relative opacity-50 cursor-not-allowed",
                  "text-muted-foreground"
                )}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5 mb-1" />
                  {item.notificationCount && isAuthenticated && (
                    <Badge 
                      className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center rounded-full text-xs font-bold opacity-50"
                    >
                      {item.notificationCount}
                    </Badge>
                  )}
                </div>
                <span className="text-xs">{item.label}</span>
              </div>
            );
          }
          
          // Render as normal link for unrestricted items or authenticated users
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center px-1 pt-2 hover:bg-accent relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <item.icon className="w-5 h-5 mb-1" />
                {item.notificationCount && isAuthenticated && (
                  <Badge 
                    className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center rounded-full text-xs font-bold"
                  >
                    {item.notificationCount}
                  </Badge>
                )}
              </div>
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  )
}

export { BottomNavigation }