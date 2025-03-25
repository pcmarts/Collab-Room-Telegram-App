import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TextLoop } from "@/components/ui/text-loop";
import { 
  COLLAB_TYPES,
  TWITTER_COLLAB_TYPES
} from "@shared/schema";

export default function Welcome() {
  const [_, setLocation] = useLocation();
  const [referralCode, setReferralCode] = useState('');
  
  // Combine all collaboration types for the animation
  const allCollabTypes = [
    ...COLLAB_TYPES, 
    ...TWITTER_COLLAB_TYPES.map(type => `Twitter ${type}`)
  ];

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
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90 p-4 flex flex-col items-center justify-center">
      <div className="max-w-md mx-auto space-y-8 w-full">
        <div className="text-center space-y-6">
          <Card className="border border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6 pb-8">
              <div className="flex flex-col items-center justify-center space-y-8 px-4">
                <h2 className="text-2xl font-bold tracking-tight">Discover powerful</h2>
                
                <div className="text-center w-full">
                  <TextLoop
                    interval={1.5}
                    className="text-3xl font-bold text-primary block min-h-[48px]"
                  >
                    {allCollabTypes.map((type) => (
                      <span key={type} className="block text-center whitespace-normal">
                        {type}
                      </span>
                    ))}
                  </TextLoop>
                </div>
                
                <h2 className="text-2xl font-bold tracking-tight">for your Web3 brand</h2>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-primary/20">
          <CardContent className="pt-6 space-y-6">
            <div>
              <Label htmlFor="referral_code" className="text-base">Have a Referral Code?</Label>
              <Input
                id="referral_code"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Enter your referral code (optional)"
                className="mt-2"
              />
            </div>

            <Button
              onClick={handleContinue}
              className="w-full group transition-all"
              size="lg"
            >
              <span>Start Your Application</span>
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}