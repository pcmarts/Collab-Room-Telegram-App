import * as React from "react"
import { Link, useLocation } from "wouter"
import { User, MessageSquare, FolderPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { DiscoveryIcon } from "@/components/icons/DiscoveryIcon"
import { Badge } from "@/components/ui/badge"

const BottomNavigation = () => {
  const [location] = useLocation()
  
  // Dummy data for new matches notification count
  const newMatchesCount = 3

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
      notificationCount: newMatchesCount
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