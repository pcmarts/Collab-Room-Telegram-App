import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

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
    <div className={`${className}`}>
      <h3 className="text-sm font-medium mb-1.5">Network Statistics</h3>
      <div className="flex text-sm text-muted-foreground">
        <div>{networkStats?.users ?? 0} Total Users</div>
        <div className="mx-2">|</div>
        <div>{networkStats?.collaborations ?? 0} Live Collabs</div>
        <div className="mx-2">|</div>
        <div>{networkStats?.matches ?? 0} Matches</div>
      </div>
    </div>
  );
}