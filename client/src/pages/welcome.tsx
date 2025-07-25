import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextLoop } from "@/components/ui/text-loop";
import {
  TelegramButton,
  TelegramFixedButtonContainer,
} from "@/components/ui/telegram-button";
import { OnboardingHeader } from "@/components/layout/OnboardingHeader";
import { X } from "lucide-react";
import { COLLAB_TYPES, TWITTER_COLLAB_TYPES } from "@shared/schema";
import { applyButtonFix } from "@/App";

export default function Welcome() {
  const [_, setLocation] = useLocation();
  const [referralCode, setReferralCode] = useState("");

  // Combine all collaboration types for the animation
  const allCollabTypes = [
    ...COLLAB_TYPES,
    ...TWITTER_COLLAB_TYPES.map((type) => `Twitter ${type}`),
  ];

  const collaborationIcons = {
    "Podcast Guest Appearance": "🎙️",
    "Twitter Spaces Guest": "🐦",
    "Newsletter Feature": "📰",
    "Report & Research": "📝",
    "Twitter Exclusive Announcement": "📣",
    "Twitter Shoutout": "💬",
    "Live Stream Guest Appearance": "📺",
    "Co-Marketing on Twitter": "🤝",
    // ... add more
  };

  // Apply button fix when component mounts - reduced aggressive fixing
  useEffect(() => {
    // Apply once on mount
    applyButtonFix();

    // Single timeout to apply again after initial render
    const timeoutId = setTimeout(() => {
      applyButtonFix();
    }, 500);

    // Cleanup on unmount
    return () => clearTimeout(timeoutId);
  }, []);

  // Extract referral code from URL when component mounts
  useEffect(() => {
    // Get referral code from URL if it exists
    const searchParams = new URLSearchParams(window.location.search);
    const urlReferralCode = searchParams.get("referral");

    if (urlReferralCode) {
      console.log("Found referral code in URL:", urlReferralCode);
      setReferralCode(urlReferralCode);
    }
  }, []);

  const handleContinue = () => {
    if (referralCode.trim()) {
      // Store referral code if provided and log it
      const cleanReferralCode = referralCode.trim();
      console.log("Storing referral code:", cleanReferralCode);
      sessionStorage.setItem("referralCode", cleanReferralCode);
    } else {
      // Clear any existing referral code if none provided
      sessionStorage.removeItem("referralCode");
    }
    setLocation("/personal-info");
  };

  const handleClose = () => {
    setLocation("/discover");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header matching personal-info page */}
      <OnboardingHeader
        title="Signup to Collab Room"
        step={0}
        totalSteps={0}
        backUrl="/discover"
      />

      <div
        className="p-4 overflow-y-auto flex flex-col justify-center"
        style={{ height: "calc(100vh - 80px)" }}
      >
        <div className="max-w-md mx-auto space-y-8 w-full">
          <div className="text-center space-y-6">
            <div className="text-center w-full">
              <TextLoop
                interval={0.5}
                className="text-lg font-medium text-gray-900 block min-h-[40px]"
              >
                {allCollabTypes.map((type) => (
                  <span
                    key={type}
                    className="block text-center whitespace-normal px-4 flex items-center justify-center gap-2"
                  >
                    <span>{collaborationIcons[type] || "🤝"}</span>
                    {type}
                  </span>
                ))}
              </TextLoop>
            </div>
          </div>

          <div className="text-center space-y-2 py-4">
            <p className="text-sm text-gray-500">
              Join 50+ Web3 professionals already collaborating
            </p>
            <div className="flex justify-center gap-1">
              <img
                src="https://gunifdyywvzgntaubezl.supabase.co/storage/v1/object/public/logos//bondexapp_sd.jpg"
                alt="Bondex"
                className="w-6 h-6 rounded-full object-cover border border-gray-600"
              />
              <img
                src="https://gunifdyywvzgntaubezl.supabase.co/storage/v1/object/public/logos//Cookie3_com_sd.jpg"
                alt="Cookie3"
                className="w-6 h-6 rounded-full object-cover border border-gray-600"
              />
              <img
                src="https://gunifdyywvzgntaubezl.supabase.co/storage/v1/object/public/logos//poapxyz_sd.jpg"
                alt="POAP"
                className="w-6 h-6 rounded-full object-cover border border-gray-600"
              />
              <img
                src="https://gunifdyywvzgntaubezl.supabase.co/storage/v1/object/public/logos//XBorgHQ_sd.jpg"
                alt="XBorg"
                className="w-6 h-6 rounded-full object-cover border border-gray-600"
              />
              <img
                src="https://gunifdyywvzgntaubezl.supabase.co/storage/v1/object/public/logos//Flight3official_sd.jpg"
                alt="Flight3"
                className="w-6 h-6 rounded-full object-cover border border-gray-600"
              />
              <img
                src="https://gunifdyywvzgntaubezl.supabase.co/storage/v1/object/public/logos//re_sd.jpg"
                alt="RE"
                className="w-6 h-6 rounded-full object-cover border border-gray-600"
              />
            </div>
          </div>

          {/* Button moved to middle of page */}
          <div className="px-4">
            <button
              type="button"
              onClick={handleContinue}
              className="w-full text-center py-3 px-4 rounded font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              style={{
                cursor: "pointer",
                backgroundColor: "#4034B9",
                color: "white",
                border: "none",
                fontSize: "16px",
                fontWeight: "bold",
                height: "48px",
                minHeight: "48px",
                borderRadius: "6px",
              }}
            >
              Apply for early access →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
