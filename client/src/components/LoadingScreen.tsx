import { useState, useEffect } from "react";
import { Loader2, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Define props interface to receive preloading information from App.tsx
interface LoadingScreenProps {
  preloadStatus?: {
    swipes: "idle" | "loading" | "success" | "error";
    potentialMatches: "idle" | "loading" | "success" | "error";
    collaborations: "idle" | "loading" | "success" | "error";
  };
  isPreloadingComplete?: boolean;
}

export function LoadingScreen({ 
  preloadStatus = { swipes: "idle", potentialMatches: "idle", collaborations: "idle" },
  isPreloadingComplete = false
}: LoadingScreenProps) {
  const [loadingText, setLoadingText] = useState("Loading");
  const [progress, setProgress] = useState(0);
  const [displayMessages, setDisplayMessages] = useState<string[]>([
    "Initializing app...",
  ]);

  // Calculate total preloading progress percentage
  const calculatePreloadProgress = () => {
    const statusValues = {
      idle: 0,
      loading: 50, 
      error: 75,  // Count errors as partial progress to avoid getting stuck
      success: 100
    };
    
    const swipesProgress = statusValues[preloadStatus.swipes];
    const matchesProgress = statusValues[preloadStatus.potentialMatches];
    const collabsProgress = statusValues[preloadStatus.collaborations];
    
    // Average the progress of all three tasks
    return Math.round((swipesProgress + matchesProgress + collabsProgress) / 3);
  };

  // Animate loading text with dots
  useEffect(() => {
    const texts = ["Loading", "Loading.", "Loading..", "Loading..."];
    let index = 0;

    const interval = setInterval(() => {
      setLoadingText(texts[index]);
      index = (index + 1) % texts.length;
    }, 400);

    return () => clearInterval(interval);
  }, []);

  // Update display messages based on preload status
  useEffect(() => {
    // Create a list of messages to display based on preload status
    const messages: string[] = ["Initializing app..."];
    
    if (preloadStatus.swipes === "loading") {
      messages.push("Loading swipe history...");
    } else if (preloadStatus.swipes === "success") {
      messages.push("Swipe history loaded");
    } else if (preloadStatus.swipes === "error") {
      messages.push("Swipe history will load on demand");
    }
    
    if (preloadStatus.potentialMatches === "loading") {
      messages.push("Finding potential matches...");
    } else if (preloadStatus.potentialMatches === "success") {
      messages.push("Potential matches ready");
    } else if (preloadStatus.potentialMatches === "error") {
      messages.push("Matches will load on demand");
    }
    
    if (preloadStatus.collaborations === "loading") {
      messages.push("Preparing discovery cards...");
    } else if (preloadStatus.collaborations === "success") {
      messages.push("Discovery cards ready");
    } else if (preloadStatus.collaborations === "error") {
      messages.push("Cards will load on demand");
    }
    
    if (isPreloadingComplete) {
      messages.push("All data ready!");
    }
    
    setDisplayMessages(messages);
  }, [preloadStatus, isPreloadingComplete]);

  // Animate progress bar
  useEffect(() => {
    // Start with the preload progress or a minimum value
    const preloadProgress = calculatePreloadProgress();
    const startValue = Math.max(Math.floor(Math.random() * 20) + 10, preloadProgress);
    setProgress(startValue);

    // Increase progress gradually, but never reach 100% until actually loaded
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        // If preloading is complete, aim for a higher value
        const target = isPreloadingComplete ? 95 : 85;
        
        // Use preload progress as a minimum floor value
        const preloadProgress = calculatePreloadProgress();
        const minimum = Math.max(prevProgress, preloadProgress);
        
        // Slow down as we get closer to target
        const increment = Math.max(1, 10 - Math.floor(prevProgress / 10));
        const nextProgress = minimum + increment;

        // Cap at target - the final jump to 100% happens when the app is loaded
        return Math.min(target, nextProgress);
      });
    }, 400);

    return () => clearInterval(interval);
  }, [preloadStatus, isPreloadingComplete]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center p-8 rounded-lg animate-fadeIn max-w-sm w-full">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
          <Loader2 className="h-16 w-16 animate-spin text-primary relative" />
        </div>

        <h3 className="text-2xl font-medium mt-6">{loadingText}</h3>

        <div className="text-sm text-muted-foreground mt-4 mb-4 text-center flex flex-col space-y-2">
          {displayMessages.map((message, index) => (
            <div 
              key={index} 
              className="flex items-center space-x-2 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {message.includes("ready") || message.includes("loaded") || message.includes("All data ready") ? (
                <Check className="h-4 w-4 text-green-500 animate-fadeIn" />
              ) : message.includes("Loading") || message.includes("Finding") || message.includes("Preparing") ? (
                <span className="h-4 w-4 rounded-full bg-primary/20 animate-pulse-subtle"></span>
              ) : null}
              <span>{message}</span>
              
              {/* Show "New!" badge for preloaded discovery feature */}
              {(message.includes("Discovery cards ready") || message.includes("Preparing discovery")) && (
                <Badge variant="outline" className="ml-2 bg-primary/10 text-primary text-xs animate-fadeIn">New!</Badge>
              )}
            </div>
          ))}
        </div>

        <div className="w-full mt-4">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-right mt-2 text-muted-foreground">
            {Math.round(progress)}%
          </p>
        </div>
      </div>
    </div>
  );
}
