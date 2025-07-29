import { useState, useEffect } from "react"
import { Link, useLocation } from "wouter"
import { User, MessageSquare, FolderPlus, Users, Inbox, Layers, Copy, SquareStack, Combine, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { DiscoveryIcon } from "@/components/icons/DiscoveryIcon"
import { Badge } from "@/components/ui/badge"
import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import { useNavigationPreloader } from "@/hooks/useNavigationPreloader"
import { triggerHapticFeedback } from "@/lib/haptics"

const BottomNavigation = () => {
  const [location] = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const { preloadRoute, preloadAllNavigation, isPreloaded } = useNavigationPreloader()
  
  // Check authentication status and get user profile
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const profile = await apiRequest('/api/profile');
        setIsAuthenticated(true);
        setUserProfile(profile);
      } catch (error) {
        setIsAuthenticated(false);
        setUserProfile(null);
      }
    };
    checkAuth();
  }, []);

  // Preload all navigation components on mount
  useEffect(() => {
    // Start preloading immediately when bottom navigation mounts
    preloadAllNavigation();
  }, [preloadAllNavigation]);

  // Check if user is authenticated but not approved
  const isApplicationPending = isAuthenticated && userProfile && !userProfile.user.is_approved;
  
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

  // Fetch collaboration requests summary for My Collabs badge (only if authenticated)
  const { data: requestsSummary } = useQuery({
    queryKey: ['/api/collaboration-requests/summary'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/collaboration-requests/summary');
        return response || { totalPendingCount: 0 };
      } catch (error) {
        console.error('Error fetching collaboration requests summary:', error);
        return { totalPendingCount: 0 };
      }
    },
    enabled: isAuthenticated,
    // Optimize to reduce network requests
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    retry: 1,
  });

  // Calculate collaboration requests count
  const collaborationRequestsCount = requestsSummary?.totalPendingCount > 0 ? requestsSummary.totalPendingCount : null;

  const navItems = [
    {
      label: "Discover",
      icon: DiscoveryIcon,
      href: "/discover",
      requiresAuth: false,
    },
    {
      label: "My Collabs",
      icon: Sparkles,
      href: "/my-collaborations",
      requiresAuth: true,
    },
    {
      label: "Requests",
      icon: Inbox,
      href: "/requests",
      requiresAuth: true,
      notificationCount: collaborationRequestsCount
    },
    {
      label: "My Matches",
      icon: MessageSquare,
      href: "/matches",
      requiresAuth: true,
      notificationCount: matchesCount > 0 ? matchesCount : null
    },
  ]

  // Handle hover to preload specific route
  const handleItemHover = (href: string) => {
    preloadRoute(href);
  };

  // Handle navigation item click with haptic feedback
  const handleItemClick = (href: string) => {
    // Trigger very light haptic feedback for menu navigation
    triggerHapticFeedback('selection');
    // Preload the route as well
    preloadRoute(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full h-24 bg-background border-t border-border pb-6" style={{ bottom: '0px', position: 'fixed' }}>
      <div className="grid h-full grid-cols-4 mx-auto">
        {navItems.map((item) => {
          const isRestricted = item.requiresAuth && !isAuthenticated;
          const isPendingRestricted = item.requiresAuth && isApplicationPending;
          const isActive = location === item.href;
          
          if (isRestricted || isPendingRestricted) {
            // Render as disabled for unauthenticated users or users with pending applications
            return (
              <div
                key={item.href}
                className={cn(
                  "flex flex-col items-center justify-center px-1 pt-2 relative opacity-50 cursor-not-allowed",
                  "text-muted-foreground"
                )}
                onMouseEnter={() => handleItemHover(item.href)}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5 mb-1" />
                  {item.notificationCount && isAuthenticated && !isApplicationPending && (
                    <Badge 
                      className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center rounded-full text-xs font-bold opacity-50 bg-primary text-primary-foreground"
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
              onMouseEnter={() => handleItemHover(item.href)}
              onClick={() => handleItemClick(item.href)}
            >
              <div className="relative">
                <item.icon className="w-5 h-5 mb-1" />
                {item.notificationCount && isAuthenticated && (
                  <Badge 
                    className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center rounded-full text-xs font-bold bg-primary text-primary-foreground"
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