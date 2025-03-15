import { Link, useLocation } from "wouter";
import { MessageSquare, Search, Settings } from "lucide-react";

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t">
      <div className="flex justify-around items-center p-2">
        <Link href="/discover">
          <a className={`flex flex-col items-center p-2 ${location === '/discover' ? 'text-primary' : 'text-muted-foreground'}`}>
            <Search className="h-6 w-6" />
            <span className="text-xs mt-1">Discover</span>
          </a>
        </Link>
        
        <Link href="/my-matches">
          <a className={`flex flex-col items-center p-2 ${location === '/my-matches' ? 'text-primary' : 'text-muted-foreground'}`}>
            <MessageSquare className="h-6 w-6" />
            <span className="text-xs mt-1">My Matches</span>
          </a>
        </Link>
        
        <Link href="/dashboard">
          <a className={`flex flex-col items-center p-2 ${location === '/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}>
            <Settings className="h-6 w-6" />
            <span className="text-xs mt-1">Settings</span>
          </a>
        </Link>
      </div>
    </nav>
  );
}
