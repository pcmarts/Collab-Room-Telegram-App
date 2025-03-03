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

  // Allow all devices to access the app
  return <>{children}</>;
}