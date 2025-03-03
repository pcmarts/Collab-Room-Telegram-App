import { useEffect, useState } from "react";

interface MobileCheckProps {
  children: React.ReactNode;
}

export function MobileCheck({ children }: MobileCheckProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Mobile Only Access</h1>
          <p className="text-muted-foreground">
            This application is optimized for mobile devices only. Please access it from your smartphone or tablet.
          </p>
          <div className="mt-4">
            <img 
              src="/qr-placeholder.svg" 
              alt="QR Code" 
              className="mx-auto w-32 h-32 opacity-50"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Scan with your mobile device
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
