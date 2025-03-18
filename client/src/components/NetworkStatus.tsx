import { useEffect, useState } from "react";
import { Users, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NetworkStatusProps {
  className?: string;
}

export function NetworkStatus({ className = "" }: NetworkStatusProps) {
  // In a real application, this would fetch from the API 
  // or use WebSockets for live updates
  const [stats, setStats] = useState({
    users: 0,
    collaborations: 0,
    loading: true
  });

  useEffect(() => {
    // Simulate API call
    const fetchNetworkStats = async () => {
      // In a real application, this would be an API call
      // For now, we're using mock data with a realistic range
      const mockFetch = () => {
        return new Promise<{users: number, collaborations: number}>((resolve) => {
          setTimeout(() => {
            resolve({
              users: Math.floor(Math.random() * 30) + 70, // Between 70-100 users
              collaborations: Math.floor(Math.random() * 20) + 30, // Between 30-50 collabs
            });
          }, 1000);
        });
      };

      const data = await mockFetch();
      setStats({
        ...data,
        loading: false
      });
    };

    fetchNetworkStats();

    // Simulate periodic updates
    const intervalId = setInterval(() => {
      setStats(prev => ({
        users: prev.users + (Math.random() > 0.7 ? 1 : 0), // Occasionally increment
        collaborations: prev.collaborations + (Math.random() > 0.8 ? 1 : 0), // Less frequently increment
        loading: false
      }));
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  if (stats.loading) {
    return null; // Or a skeleton loader
  }

  return (
    <div className={`flex justify-center gap-4 text-xs text-muted-foreground ${className}`}>
      <Badge variant="outline" className="bg-background/80 backdrop-blur-sm px-2 py-1 h-auto">
        <Users className="h-3 w-3 mr-1 text-primary" />
        <span>{stats.users} active users</span>
      </Badge>
      <Badge variant="outline" className="bg-background/80 backdrop-blur-sm px-2 py-1 h-auto">
        <FileSpreadsheet className="h-3 w-3 mr-1 text-primary" />
        <span>{stats.collaborations} live collaborations</span>
      </Badge>
    </div>
  );
}