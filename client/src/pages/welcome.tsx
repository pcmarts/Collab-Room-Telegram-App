import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";

export default function Welcome() {
  const [_, setLocation] = useLocation();
  const [referralCode, setReferralCode] = useState('');

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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Collab Room</h1>
          <p className="text-muted-foreground">
            "Tinder" for Web3 Brand Collaborations
          </p>
          <p className="text-muted-foreground">
            🔒 Privacy first - your contact details are hidden 
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <div className="w-3 h-3 rounded-full bg-primary/50"></div>
          <div className="w-3 h-3 rounded-full bg-primary/50"></div>
          <div className="w-3 h-3 rounded-full bg-primary/50"></div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="referral_code">Have a Referral Code?</Label>
            <Input
              id="referral_code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="Enter your referral code (optional)"
            />
          </div>

          <Button
            onClick={handleContinue}
            className="w-full mt-6"
          >
            Start Application
          </Button>
        </div>
      </div>
    </div>
  );
}