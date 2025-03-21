import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90 p-4 flex flex-col items-center justify-center">
      <div className="max-w-md mx-auto space-y-8 w-full">
        <div className="text-center space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-3">
            <img 
              src="/images/collab-room-logo.jpg" 
              alt="The Collab Room" 
              className="h-24 w-auto rounded-lg shadow-md"
            />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
              Welcome to The Collab Room
            </h1>
            <p className="text-lg font-medium">
              The fastest, simplest way for Web3 brands to discover powerful marketing collaborations.
            </p>
          </div>

          <Card className="border border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p>Connect with trusted CMOs and founders in the Web3 space</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p>Find targeted collaboration opportunities that align with your brand</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p>Privacy first — no contact details shared unless both parties match</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-center gap-2 my-4">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <div className="w-3 h-3 rounded-full bg-primary/50"></div>
          <div className="w-3 h-3 rounded-full bg-primary/50"></div>
          <div className="w-3 h-3 rounded-full bg-primary/50"></div>
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