import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { TextLoop } from "@/components/ui/text-loop";
import { OnboardingHeader } from "@/components/layout/OnboardingHeader";
import { COLLAB_TYPES, TWITTER_COLLAB_TYPES } from "@shared/schema";

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
        title="Apply for Early Access"
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
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              The Collaboration Platform for Web3 Marketers
            </h1>
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
              Join Web3 companies sharing powerful co-marketing opportunities
            </p>
            <div className="flex justify-center gap-2 text-2xl">
              <span>🎙️</span>
              <span>🐦</span>
              <span>📰</span>
              <span>📺</span>
              <span>🤝</span>
            </div>
          </div>

          {/* Button moved to middle of page */}
          <div className="px-4">
            <button
              type="button"
              onClick={handleContinue}
              className="w-full text-center py-3 px-4 rounded-md font-bold text-white bg-[#4034B9] hover:bg-[#4034B9]/90 transition-colors h-12 text-base"
            >
              Apply for early access →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
