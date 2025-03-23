import * as React from "react"
import { Link, useLocation } from "wouter"
import { User, MessageSquare, FolderPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { DiscoveryIcon } from "@/components/icons/DiscoveryIcon"
import { Badge } from "@/components/ui/badge"
import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"

const BottomNavigation = () => {
  const [location] = useLocation()
  
  // Fetch actual matches count from API
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
    // Don't show loading states or errors in navigation
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    retry: 1,
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
              location === item.href && "text-primary"
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