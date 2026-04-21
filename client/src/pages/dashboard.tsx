import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";
import {
  UserIcon,
  Users,
  Building,
  Bell,
  ChevronRight,
  Settings,
  Trash2,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { FaLinkedin, FaTwitter } from "react-icons/fa";

import { PageHeader } from "../components/PageHeader";
import { Eyebrow } from "@/components/brand";
import type {
  User as UserType,
  Company,
  NotificationPreferences,
  MarketingPreferences,
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ProfileData {
  user: UserType;
  company: Company;
  preferences: any;
  notificationPreferences: NotificationPreferences;
  marketingPreferences: MarketingPreferences;
}

function parseNotificationFlag(raw: unknown): boolean {
  if (typeof raw === "string") {
    return ["t", "true"].includes(raw.toLowerCase());
  }
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw > 0;
  return false;
}

type NavRowProps = {
  Icon: typeof UserIcon;
  label: string;
  hint?: string;
  onClick: () => void;
};

function NavRow({ Icon, label, hint, onClick }: NavRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 border-b border-hairline px-4 py-4 text-left transition-colors duration-fast ease-out active:bg-surface"
    >
      <Icon className="h-4 w-4 shrink-0 text-text-muted" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium text-text">{label}</p>
        {hint && <p className="text-sm text-text-muted truncate">{hint}</p>}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-text-subtle" />
    </button>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: profile, isLoading, refetch } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
    staleTime: 0,
    refetchOnMount: true,
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deleteAccountMutation = useMutation({
    mutationFn: async () =>
      apiRequest("/api/user/delete-account", "DELETE"),
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "All your data has been removed.",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1200);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Couldn't delete",
        description:
          error instanceof Error ? error.message : "Try again in a moment.",
      });
    },
  });

  const handleDeleteAccount = () => {
    setShowDeleteDialog(false);
    deleteAccountMutation.mutate();
  };

  useEffect(() => {
    if (profile?.notificationPreferences) {
      setNotificationsEnabled(
        parseNotificationFlag(
          profile.notificationPreferences.notifications_enabled
        )
      );
    }
  }, [profile]);

  const handleNotificationToggle = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    try {
      setIsSubmitting(true);
      await apiRequest(
        `/api/notification-toggle?_t=${Date.now()}`,
        "POST",
        { enabled }
      );
      await refetch();
      toast({
        title: enabled ? "Notifications on" : "Notifications off",
        description: enabled
          ? "We'll ping you on Telegram when things match."
          : "You won't get Telegram pings.",
      });
    } catch {
      setNotificationsEnabled(!enabled);
      toast({
        variant: "destructive",
        title: "Couldn't update",
        description: "Try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-text-subtle" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-md px-6 pt-14">
        <h1 className="text-xl font-semibold tracking-tight text-text">
          Profile not found
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Finish signup to see your account.
        </p>
        <Button
          size="sm"
          className="mt-4"
          onClick={() => setLocation("/welcome")}
        >
          Get started
        </Button>
      </div>
    );
  }

  if (!profile.user.is_approved) {
    return (
      <div className="mx-auto max-w-md px-6 pt-14">
        <h1 className="text-xl font-semibold tracking-tight text-text">
          Application in review
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          We'll ping you the moment you're approved.
        </p>
        <Button
          size="sm"
          variant="secondary"
          className="mt-4"
          onClick={() => setLocation("/application-status")}
        >
          View status
        </Button>
      </div>
    );
  }

  const { user } = profile;

  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready();
  }

  return (
    <div className="min-h-[100svh] bg-background pb-20">
      <PageHeader title="Account" showBackButton backUrl="/discover" />

      <div className="mx-auto max-w-md">
        <div className="px-4 py-5">
          <Eyebrow>Signed in as</Eyebrow>
          <p className="mt-1 text-md font-semibold text-text">
            {user.first_name}
            {user.last_name ? ` ${user.last_name}` : ""}
          </p>
          <p className="text-sm text-text-muted">@{user.handle}</p>
        </div>

        <nav>
          <NavRow
            Icon={UserIcon}
            label="Profile"
            hint="Name, email, social"
            onClick={() => setLocation("/profile-overview")}
          />
          <NavRow
            Icon={Building}
            label="Company"
            hint="Description, sectors, token"
            onClick={() => setLocation("/company-info")}
          />
          <NavRow
            Icon={Users}
            label="Invite friends"
            hint="Share your referral link"
            onClick={() => setLocation("/referrals")}
          />
          {user.is_admin && (
            <NavRow
              Icon={Settings}
              label="Admin"
              hint="Internal tools"
              onClick={() => setLocation("/admin")}
            />
          )}
        </nav>

        <div className="mt-6 border-y border-hairline">
          <div className="flex items-center gap-3 px-4 py-4">
            <Bell className="h-4 w-4 shrink-0 text-text-muted" />
            <div className="min-w-0 flex-1">
              <p className="text-base font-medium text-text">
                Telegram notifications
              </p>
              <p className="text-sm text-text-muted">
                New requests and matches
              </p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleNotificationToggle}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="mt-8 px-4">
          <Eyebrow>Danger zone</Eyebrow>
          <p className="mt-2 text-sm text-text-muted">
            Deleting your account removes your profile, company, posted collabs,
            applications, and matches. There's no undo.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 text-destructive border-destructive/50 hover:bg-destructive/5"
            onClick={() => setShowDeleteDialog(true)}
            disabled={deleteAccountMutation.isPending}
          >
            {deleteAccountMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete account
              </>
            )}
          </Button>
        </div>

      </div>

      <footer className="mt-10 bg-brand-dark px-4 py-8 text-brand-dark-fg">
        <div className="mx-auto max-w-md">
          <Eyebrow tone="muted" className="text-brand-dark-fg/60">
            Built by Paul Martin
          </Eyebrow>
          <div className="mt-3 flex gap-4">
            <a
              href="https://www.linkedin.com/in/thisispaulmartin/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-brand-dark-fg/80 hover:text-brand-dark-fg"
            >
              <FaLinkedin className="h-3.5 w-3.5" />
              LinkedIn
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
            <a
              href="https://x.com/pcmarts"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-brand-dark-fg/80 hover:text-brand-dark-fg"
            >
              <FaTwitter className="h-3.5 w-3.5" />
              Twitter
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>
      </footer>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes your profile, company info, posted collabs,
              applications, and matches. There's no undo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
