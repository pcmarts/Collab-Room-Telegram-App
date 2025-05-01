import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function LoadingScreen() {
  const [loadingText, setLoadingText] = useState("Loading");
  const [progress, setProgress] = useState(0);

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

  // Animate progress bar
  useEffect(() => {
    // Start from a random value between 10-30% to make it feel like something already happened
    const startValue = Math.floor(Math.random() * 20) + 10;
    setProgress(startValue);

    // Increase progress gradually, but never reach 100% until actually loaded
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        // Slow down as we get closer to 90%
        const increment = Math.max(1, 10 - Math.floor(prevProgress / 10));
        const nextProgress = prevProgress + increment;

        // Cap at 90% - the final jump to 100% happens when the app is loaded
        return Math.min(90, nextProgress);
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center p-8 rounded-lg animate-fadeIn max-w-sm w-full">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
          <Loader2 className="h-16 w-16 animate-spin text-primary relative" />
        </div>

        <h3 className="text-2xl font-medium mt-6">{loadingText}</h3>

        <p className="text-sm text-muted-foreground mt-4 mb-6 text-center">
          Loading the Collab Room...
        </p>

        <div className="w-full">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-right mt-2 text-muted-foreground">
            {Math.round(progress)}%
          </p>
        </div>
      </div>
    </div>
  );
}
