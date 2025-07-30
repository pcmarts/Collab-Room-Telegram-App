import { Zap } from "lucide-react";

interface UserCollabCountProps {
  className?: string;
  count: number;
  isLoading?: boolean;
}

export function UserCollabCount({ className = "", count, isLoading }: UserCollabCountProps) {
  if (isLoading) {
    return (
      <div className={`${className} border-t border-b py-3 border-border/50`}>
        <div className="flex justify-center text-sm">
          <div className="flex items-center animate-pulse">
            <Zap className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <span className="text-muted-foreground text-xs">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} border-t border-b py-3 border-border/50`}>
      <div className="flex justify-center text-sm">
        <div className="flex items-center">
          <Zap className="h-3.5 w-3.5 mr-1.5 text-foreground" />
          <span className="font-medium">
            {count}
          </span>
          <span className="ml-1 text-muted-foreground text-xs">
            {count === 1 ? 'collab' : 'collabs'}
          </span>
        </div>
      </div>
    </div>
  );
}