import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextLoop } from "@/components/ui/text-loop";
import { TelegramButton, TelegramFixedButtonContainer } from "@/components/ui/telegram-button";
import { X } from "lucide-react";
import { 
  COLLAB_TYPES,
  TWITTER_COLLAB_TYPES
} from "@shared/schema";
import { applyButtonFix } from "@/App";

export default function Welcome() {
  const [_, setLocation] = useLocation();
  const [referralCode, setReferralCode] = useState('');
  
  // Combine all collaboration types for the animation
  const allCollabTypes = [
    ...COLLAB_TYPES, 
    ...TWITTER_COLLAB_TYPES.map(type => `Twitter ${type}`)
  ];
  
  // Apply button fix when component mounts and after any render
  useEffect(() => {
    // Apply immediately on mount
    applyButtonFix();
    
    // Set up interval to keep applying the fix
    const fixInterval = setInterval(() => {
      applyButtonFix();
    }, 300);
    
    // Cleanup on unmount
    return () => clearInterval(fixInterval);
  }, []);
  
  // Extract referral code from URL when component mounts
  useEffect(() => {
    // Get referral code from URL if it exists
    const searchParams = new URLSearchParams(window.location.search);
    const urlReferralCode = searchParams.get('referral');
    
    if (urlReferralCode) {
      console.log('Found referral code in URL:', urlReferralCode);
      setReferralCode(urlReferralCode);
    }
  }, []);

  const handleContinue = () => {
    if (referralCode.trim()) {
      // Store referral code if provided and log it
      const cleanReferralCode = referralCode.trim();
      console.log('Storing referral code:', cleanReferralCode);
      sessionStorage.setItem('referralCode', cleanReferralCode);
    } else {
      // Clear any existing referral code if none provided
      sessionStorage.removeItem('referralCode');
    }
    setLocation('/personal-info');
  };

  const handleClose = () => {
    setLocation('/discover');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90 p-4 flex flex-col items-center justify-center relative">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClose}
        className="absolute top-4 right-4 z-10 hover:bg-background/20"
      >
        <X className="w-5 h-5" />
      </Button>
      
      <div className="max-w-md mx-auto space-y-8 w-full">
        <div className="text-center space-y-6">
          <div className="flex flex-col items-center justify-center space-y-8 px-4 py-6">
            <h2 className="text-base tracking-tight" style={{ color: '#8F8F99' }}>Find your next...</h2>
            
            <div className="text-center w-full">
              <TextLoop
                interval={0.5}
                className="text-base text-white block min-h-[32px]"
              >
                {allCollabTypes.map((type) => (
                  <span key={type} className="block text-center whitespace-normal">
                    {type}
                  </span>
                ))}
              </TextLoop>
            </div>
          </div>
        </div>

        <Card className="border border-primary/20">
          <CardContent className="pt-6 space-y-6 pb-16">
            <div>
              <Label htmlFor="referral_code" className="text-base flex items-center gap-2">
                Have a Referral Code?
                {referralCode && (
                  <span className="text-xs text-green-500 font-normal">
                    (Referral code applied)
                  </span>
                )}
              </Label>
              <Input
                id="referral_code"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Enter your referral code (optional)"
                className={`mt-2 ${referralCode ? 'border-green-500 focus-visible:ring-green-500' : ''}`}
              />
            </div>
          </CardContent>
          
          {/* Use fixed container for better mobile visibility */}
          <TelegramFixedButtonContainer>
            <TelegramButton
              type="button"
              onClick={handleContinue}
              text="Next"
            />
          </TelegramFixedButtonContainer>
        </Card>
      </div>
    </div>
  );
}