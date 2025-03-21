import { useEffect, useState } from "react";
import { Users, FileSpreadsheet, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";

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
      <div className={`flex justify-center gap-3 ${className}`}>
        <Card className="px-3 py-2 flex items-center justify-center opacity-70 bg-background/80 backdrop-blur-sm animate-pulse">
          <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm">Loading network stats...</span>
        </Card>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      <Card className="p-3 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
        <div className="flex items-center justify-between">
          <div className="bg-primary/10 rounded-full p-2">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Users</span>
        </div>
        <div className="mt-3 text-center">
          <div className="text-3xl font-bold">{networkStats?.users ?? 0}</div>
          <div className="text-xs text-muted-foreground mt-1">Active Community Members</div>
        </div>
      </Card>
      <Card className="p-3 bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/20">
        <div className="flex items-center justify-between">
          <div className="bg-blue-500/10 rounded-full p-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-500" />
          </div>
          <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Collabs</span>
        </div>
        <div className="mt-3 text-center">
          <div className="text-3xl font-bold">{networkStats?.collaborations ?? 0}</div>
          <div className="text-xs text-muted-foreground mt-1">Live Collaborations</div>
        </div>
      </Card>
    </div>
  );
}