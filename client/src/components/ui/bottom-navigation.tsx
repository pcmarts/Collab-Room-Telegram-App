import { useState, useEffect } from "react"
import { Link, useLocation } from "wouter"
import { MessageSquare, Inbox, Sparkles, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import { useNavigationPreloader } from "@/hooks/useNavigationPreloader"
import { triggerHapticFeedback } from "@/lib/haptics"
import { SignupPromptDialog } from "@/components/SignupPromptDialog"

const BottomNavigation = () => {
  const [location, setLocation] = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const { preloadRoute, preloadAllNavigation, isPreloaded } = useNavigationPreloader()
  const [showSignupDialog, setShowSignupDialog] = useState(false)
  
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
      icon: Search,
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

  // Handle restricted item click (show signup dialog)
  const handleRestrictedItemClick = (item: any) => {
    // Trigger haptic feedback
    triggerHapticFeedback('selection');
    
    // Show signup dialog for My Collabs specifically
    if (item.href === '/my-collaborations' && !isAuthenticated) {
      setShowSignupDialog(true);
    }
  };

  // Handle signup navigation
  const handleSignup = () => {
    setShowSignupDialog(false);
    setLocation('/welcome');
  };

  const itemClass = (active: boolean, disabled: boolean) =>
    cn(
      "flex flex-col items-center justify-center gap-1 h-full relative select-none",
      "transition-colors duration-fast ease-out",
      disabled && "opacity-40 cursor-not-allowed",
      !disabled && "active:bg-surface",
      active ? "text-brand" : "text-text-muted"
    );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 w-full border-t border-hairline bg-background"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="grid grid-cols-4 h-14">
        {navItems.map((item) => {
          const isRestricted = item.requiresAuth && !isAuthenticated;
          const isPendingRestricted = item.requiresAuth && isApplicationPending;
          const isActive = location === item.href;
          const Icon = item.icon;

          const iconEl = (
            <div className="relative">
              <Icon className="w-5 h-5" />
              {item.notificationCount &&
                isAuthenticated &&
                !isApplicationPending && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[10px] font-semibold tabular bg-brand text-brand-fg">
                    {item.notificationCount}
                  </span>
                )}
            </div>
          );
          const labelEl = (
            <span className="text-[11px] font-medium tracking-tight">
              {item.label}
            </span>
          );

          if (isRestricted || isPendingRestricted) {
            if (item.href === "/my-collaborations" && !isAuthenticated) {
              return (
                <button
                  type="button"
                  key={item.href}
                  className={itemClass(false, false)}
                  onMouseEnter={() => handleItemHover(item.href)}
                  onClick={() => handleRestrictedItemClick(item)}
                >
                  {iconEl}
                  {labelEl}
                </button>
              );
            }

            return (
              <div
                key={item.href}
                className={itemClass(false, true)}
                onMouseEnter={() => handleItemHover(item.href)}
              >
                {iconEl}
                {labelEl}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={itemClass(isActive, false)}
              onMouseEnter={() => handleItemHover(item.href)}
              onClick={() => handleItemClick(item.href)}
            >
              {iconEl}
              {labelEl}
            </Link>
          );
        })}
      </div>

      <SignupPromptDialog
        open={showSignupDialog}
        onOpenChange={setShowSignupDialog}
        onSignup={handleSignup}
        title="Sign up to post"
        description="Share what you're looking for — hosts will request to join."
      />
    </nav>
  );
};

export { BottomNavigation }