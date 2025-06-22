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
    },
    {
      label: "My Collabs",
      icon: FolderPlus,
      href: "/my-collaborations",
    },
    {
      label: "My Account",
      icon: User,
      href: "/dashboard",
    },
    {
      label: "My Matches",
      icon: MessageSquare,
      href: "/matches",
      notificationCount: matchesCount > 0 ? matchesCount : null
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full h-24 bg-background border-t border-border pb-6">
      <div className="grid h-full grid-cols-4 mx-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center px-1 pt-2 hover:bg-accent relative",
              location === item.href ? "text-[#FAFAFA]" : "text-[#8F8F99]"
            )}
          >
            <div className="relative">
              <item.icon className="w-5 h-5 mb-1" />
              {item.notificationCount && (
                <Badge 
                  className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center rounded-full text-xs font-bold"
                >
                  {item.notificationCount}
                </Badge>
              )}
            </div>
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

export { BottomNavigation }