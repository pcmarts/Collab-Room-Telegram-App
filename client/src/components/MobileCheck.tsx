import { useEffect, useState } from "react";

interface MobileCheckProps {
  children: React.ReactNode;
}

export function MobileCheck({ children }: MobileCheckProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // More comprehensive mobile check
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
        window.matchMedia("(max-width: 768px) and (pointer: coarse)").matches;
      setIsMobile(isMobileDevice);
      setChecked(true);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!checked) {
    return null; // Prevent flash of content while checking
  }

  if (!isMobile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-sm w-full mx-4 text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Mobile Only Access</h1>
            <p className="text-muted-foreground">
              This application is designed for Telegram mobile users only. Please access it through your Telegram mobile app.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">To access:</p>
            <ol className="text-sm text-left space-y-2">
              <li>1. Open Telegram on your mobile device</li>
              <li>2. Search for our bot "@YourBotName"</li>
              <li>3. Send the /start command</li>
            </ol>
          </div>

          <div className="opacity-50">
            <svg className="w-32 h-32 mx-auto" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-6h2v2h-2zm0-8h2v6h-2z"/>
            </svg>
            <p className="text-xs mt-2">Mobile only</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}