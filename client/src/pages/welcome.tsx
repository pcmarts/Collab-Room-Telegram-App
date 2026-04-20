import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import { OnboardingHeader } from "@/components/layout/OnboardingHeader";

const HIGHLIGHT_TYPES = [
  "Twitter Spaces",
  "Podcast guests",
  "Co-marketing",
  "Newsletters",
  "Live streams",
  "Research reports",
];

export default function Welcome() {
  const [, setLocation] = useLocation();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("referral");
    if (code) {
      setReferralCode(code);
      sessionStorage.setItem("referralCode", code);
    }
  }, []);

  const handleContinue = () => {
    if (!referralCode) sessionStorage.removeItem("referralCode");
    setLocation("/personal-info");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <OnboardingHeader
        title="The Collab Room"
        step={0}
        totalSteps={0}
        backUrl="/discover"
      />

      <div className="flex flex-1 flex-col justify-between px-6 pb-8 pt-10">
        <div className="max-w-md">
          <div className="text-xs font-medium uppercase tracking-wider text-brand tabular">
            For Web3 marketers
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text leading-[1.1]">
            Find the right brand to collab with.
            <br />
            <span className="text-text-muted">Inside Telegram.</span>
          </h1>

          <p className="mt-4 text-base text-text-muted leading-snug max-w-[38ch]">
            Browse hosted opportunities from verified brands. Request to join.
            Chat the moment you match — no intros, no threads, no warm-ups.
          </p>

          <ul className="mt-6 flex flex-wrap gap-1.5">
            {HIGHLIGHT_TYPES.map((type) => (
              <li
                key={type}
                className="rounded-full border border-hairline px-2.5 py-1 text-xs font-medium text-text-muted"
              >
                {type}
              </li>
            ))}
          </ul>

          {referralCode && (
            <p className="mt-6 text-sm text-text-muted">
              Referred by{" "}
              <span className="font-medium tabular text-text">
                {referralCode}
              </span>
              .
            </p>
          )}
        </div>

        <div className="mt-10">
          <button
            type="button"
            onClick={handleContinue}
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-md bg-brand text-base font-medium text-brand-fg transition-[background-color,transform] duration-fast ease-out hover:bg-brand-hover active:translate-y-px"
          >
            Request access
            <ArrowRight className="h-4 w-4 transition-transform duration-fast ease-out group-active:translate-x-0.5" />
          </button>
          <p className="mt-3 text-center text-xs text-text-subtle">
            Approval is manual — usually within a day.
          </p>
        </div>
      </div>
    </div>
  );
}
