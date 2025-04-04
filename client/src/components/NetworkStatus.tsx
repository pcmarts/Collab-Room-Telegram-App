import { useEffect, useState } from "react";
import { Activity, Users, Zap, Handshake } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";

interface NetworkStatusProps {
  className?: string;
}

interface NetworkStatsData {
  users: number;
  collaborations: number;
  matches: number;
}

export function NetworkStatus({ className = "" }: NetworkStatusProps) {
  const { data: networkStats, isLoading } = useQuery<NetworkStatsData>({
    queryKey: ['/api/network-stats'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  if (isLoading) {
    return (
      <div className={`flex justify-center ${className}`}>
        <div className="flex items-center justify-center text-sm text-muted-foreground animate-pulse">
          <Activity className="h-4 w-4 mr-2" />
          <span>Loading network stats...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} border-t border-b py-3 border-border/50`}>
      <h3 className="text-sm font-medium mb-2 text-muted-foreground">Network Statistics</h3>
      <div className="flex justify-between text-sm">
        <div className="flex items-center">
          <Users className="h-3.5 w-3.5 mr-1.5 text-foreground" />
          <span className="font-medium">{networkStats?.users ?? 0}</span>
          <span className="ml-1 text-muted-foreground text-xs">users</span>
        </div>
        <div className="flex items-center">
          <Zap className="h-3.5 w-3.5 mr-1.5 text-foreground" />
          <span className="font-medium">{networkStats?.collaborations ?? 0}</span>
          <span className="ml-1 text-muted-foreground text-xs">collabs</span>
        </div>
        <div className="flex items-center">
          <Handshake className="h-3.5 w-3.5 mr-1.5 text-foreground" />
          <span className="font-medium">{networkStats?.matches ?? 0}</span>
          <span className="ml-1 text-muted-foreground text-xs">matches</span>
        </div>
      </div>
    </div>
  );
}