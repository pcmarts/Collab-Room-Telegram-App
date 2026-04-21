import { Button } from '@/components/ui/button';
import { Share2, ArrowRight } from 'lucide-react';
import { Eyebrow } from '@/components/brand';
import { useReferrals } from '@/hooks/use-referrals';

interface ReferralInfoPanelProps {
  onShare?: () => void;
}

const ReferralInfoPanel = ({ onShare }: ReferralInfoPanelProps) => {
  const { referralInfo } = useReferrals();

  // Check if all referrals are used
  const allReferralsUsed = referralInfo && referralInfo.total_used >= referralInfo.total_available;

  // NoReferralsYet empty state
  if (!allReferralsUsed) {
    return (
      <section className="rounded-lg border border-hairline bg-surface p-5">
        <Eyebrow tone="brand">How it works</Eyebrow>
        <h3 className="mt-1 text-lg font-semibold tracking-tight text-text">
          Three steps to skip the line.
        </h3>

        <ol className="mt-5 divide-y divide-hairline">
          {[
            { n: '01', label: 'Share', body: 'Send your invite link to a collaborator.' },
            { n: '02', label: 'They join', body: 'Instant access — no waitlist for them.' },
            { n: '03', label: 'Track', body: 'See who landed via your code.' },
          ].map((step) => (
            <li key={step.n} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
              <span className="text-sm font-semibold tabular text-brand">
                {step.n}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text">{step.label}</p>
                <p className="mt-0.5 text-sm text-text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <Button
          className="mt-5 w-full"
          onClick={onShare}
        >
          <Share2 className="h-4 w-4" />
          Share your link
          <ArrowRight className="h-4 w-4" />
        </Button>
      </section>
    );
  }

  // AllReferralsUsed empty state
  return (
    <section className="rounded-lg border border-warm-accent/20 bg-warm-surface p-5 text-center">
      <Eyebrow tone="warm" dot>
        All used
      </Eyebrow>
      <h3 className="mt-2 text-lg font-semibold tracking-tight text-text">
        You're a community builder.
      </h3>
      <p className="mt-2 text-sm text-text-muted">
        You've spent all {referralInfo?.total_available} of your invites. Thanks for growing the room.
      </p>
      <Button variant="outline" className="mt-4">
        View referred friends
      </Button>
    </section>
  );
};

export { ReferralInfoPanel };
export default ReferralInfoPanel;