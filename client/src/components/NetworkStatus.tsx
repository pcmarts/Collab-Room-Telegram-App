import { useEffect, useState } from "react";
import { Users, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

interface NetworkStatusProps {
  className?: string;
}

interface NetworkStatsData {
  users: number;
  collaborations: number;
}

export function NetworkStatus({ className = "" }: NetworkStatusProps) {
  const { data: networkStats, isLoading } = useQuery<NetworkStatsData>({
    queryKey: ['/api/network-stats'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  if (isLoading) {
    return (
      <div className={`flex justify-center gap-4 text-xs text-muted-foreground ${className}`}>
        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm px-2 py-1 h-auto opacity-70">
          <Users className="h-3 w-3 mr-1 text-primary" />
          <span>Loading stats...</span>
        </Badge>
      </div>
    );
  }

  return (
    <div className={`flex justify-center gap-4 text-xs text-muted-foreground ${className}`}>
      <Badge variant="outline" className="bg-background/80 backdrop-blur-sm px-2 py-1 h-auto">
        <Users className="h-3 w-3 mr-1 text-primary" />
        <span>{networkStats?.users ?? 0} active users</span>
      </Badge>
      <Badge variant="outline" className="bg-background/80 backdrop-blur-sm px-2 py-1 h-auto">
        <FileSpreadsheet className="h-3 w-3 mr-1 text-primary" />
        <span>{networkStats?.collaborations ?? 0} live collaborations</span>
      </Badge>
    </div>
  );
}