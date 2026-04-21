import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { DisplayHeading, Eyebrow } from "@/components/brand";

interface StatusUpdate {
  status: string;
  message: string;
  timestamp: string;
}

interface ProfileData {
  user: {
    id: string;
    is_approved: boolean;
  };
  company?: any;
  preferences?: any;
  marketingPreferences?: any;
}

type StatusKind = "approved" | "rejected" | "processing";
type EyebrowTone = "muted" | "brand" | "warm" | "success";

const STATUS_COPY: Record<
  StatusKind,
  {
    kicker: string;
    headline: string;
    accent: string;
    Icon: typeof CheckCircle;
    iconClass: string;
    tone: EyebrowTone;
  }
> = {
  approved: {
    kicker: "Approved",
    headline: "You're",
    accent: "in.",
    Icon: CheckCircle,
    iconClass: "text-success",
    tone: "success",
  },
  rejected: {
    kicker: "Declined",
    headline: "Not this time.",
    accent: "",
    Icon: AlertTriangle,
    iconClass: "text-destructive",
    tone: "muted",
  },
  processing: {
    kicker: "In review",
    headline: "We're reviewing",
    accent: "your profile.",
    Icon: Clock,
    iconClass: "text-text-muted",
    tone: "muted",
  },
};

export default function ApplicationStatusPage() {
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [connectionActive, setConnectionActive] = useState(false);

  const { data: profile, isLoading, error } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!profile?.user?.id) return;

    const userId = profile.user.id;
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(
        `/api/application-status-updates/${userId}`
      );
      eventSource.onopen = () => setConnectionActive(true);
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setStatusUpdates((prev) => [data, ...prev]);
        if (data.status === "connection_closing") {
          eventSource?.close();
          setConnectionActive(false);
        }
      };
      eventSource.onerror = () => {
        setConnectionActive(false);
        eventSource?.close();
      };
    } catch {
      setConnectionActive(false);
    }

    return () => {
      eventSource?.close();
      setConnectionActive(false);
    };
  }, [profile?.user?.id]);

  const currentStatus: StatusKind =
    statusUpdates.length > 0
      ? (statusUpdates[0].status as StatusKind)
      : profile?.user?.is_approved
      ? "approved"
      : "processing";

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl px-6 pt-14">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-8 w-72" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-4/5" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-6 pt-14">
        <h1 className="text-xl font-semibold tracking-tight text-text">
          Couldn't load status
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Try again in a moment. If it persists, reach out on Telegram.
        </p>
      </div>
    );
  }

  const { kicker, headline, accent, Icon, iconClass, tone } =
    STATUS_COPY[currentStatus];
  const latestMessage =
    statusUpdates.length > 0
      ? statusUpdates[0].message
      : currentStatus === "approved"
      ? "You can post collabs and send requests now."
      : "Usually within a day. We'll notify you on Telegram.";
  const lastUpdated =
    statusUpdates.length > 0
      ? new Date(statusUpdates[0].timestamp).toLocaleString()
      : null;

  const isCelebration = currentStatus === "approved";

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-background px-6 pb-16 pt-14">
      <Eyebrow tone={tone} dot>
        <Icon className={`h-3 w-3 ${iconClass}`} />
        {kicker}
      </Eyebrow>

      {isCelebration ? (
        <DisplayHeading
          size="2xl"
          accent={accent}
          className="mt-4"
        >
          {headline}
        </DisplayHeading>
      ) : (
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-text leading-tight">
          {headline}
          {accent ? ` ${accent}` : ""}
        </h1>
      )}

      <p className="mt-3 text-base text-text-muted leading-snug">
        {latestMessage}
      </p>

      {lastUpdated && (
        <p className="mt-4 text-xs tabular text-text-subtle">
          Last updated {lastUpdated}
          {!connectionActive ? " · listening paused" : ""}
        </p>
      )}

      {isCelebration && (
        <div className="mt-8 rounded-md border border-hairline bg-warm-surface px-4 py-4">
          <Eyebrow tone="warm">Next steps</Eyebrow>
          <ul className="mt-3 space-y-1.5 text-sm text-text">
            <li>Post what you're looking for</li>
            <li>Request to join other hosts' collabs</li>
            <li>Tune preferences so the feed stays relevant</li>
          </ul>
        </div>
      )}

      {statusUpdates.length > 1 && (
        <div className="mt-8">
          <Eyebrow tone="muted">History</Eyebrow>
          <div className="mt-3 space-y-3">
            {statusUpdates.slice(1).map((update, i) => (
              <div
                key={i}
                className="border-b border-hairline pb-3 last:border-b-0"
              >
                <p className="text-sm text-text">{update.message}</p>
                <p className="mt-1 text-xs tabular text-text-subtle">
                  {new Date(update.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 flex gap-2">
        <Link href="/discover">
          <Button size="sm" variant={isCelebration ? "default" : "secondary"}>
            Browse the feed
          </Button>
        </Link>
      </div>
    </div>
  );
}
