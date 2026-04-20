import React, { useState, useEffect, lazy } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const _preloadCreate = () => import("./create-collaboration-v2");

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { MobileCheck } from "@/components/MobileCheck";
import { LogoAvatar } from "@/components/ui/logo-avatar";
import { CollaborationTypePill } from "@/components/CollaborationFormV2/components/CollaborationTypePill";

import {
  type Collaboration,
  type CollabApplication,
} from "@shared/schema";
import { Plus, Trash2, Users, UserCheck, UserX, Check, X, Clock } from "lucide-react";

type CollaborationWithExtras = Omit<Collaboration, "details"> & {
  details: any;
  applications?: CollabApplication[];
};

type ApplicationWithExtras = CollabApplication & {
  application_data?: any;
  collaboration?: { title?: string };
};

export default function MyCollaborations() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [highlightedCollabId, setHighlightedCollabId] = useState<string | null>(null);
  const [collabToDelete, setCollabToDelete] = useState<string | null>(null);
  const [activeCollabs, setActiveCollabs] = useState<Record<string, boolean>>({});
  const [selectedApplication, setSelectedApplication] =
    useState<ApplicationWithExtras | null>(null);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [processingApplicationId, setProcessingApplicationId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const newCollabId = urlParams.get("newCollab");
    const storedNewCollabId = localStorage.getItem("newCollaborationId");
    const highlight = newCollabId || storedNewCollabId;

    if (highlight) {
      setHighlightedCollabId(highlight);
      if (storedNewCollabId) localStorage.removeItem("newCollaborationId");
      if (newCollabId) {
        const url = new URL(window.location.href);
        url.searchParams.delete("newCollab");
        window.history.replaceState({}, "", url.toString());
      }
      setTimeout(() => setHighlightedCollabId(null), 5000);
    }
  }, []);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;

    document.body.style.overflow = "auto";
    document.body.style.position = "static";
    document.body.style.width = "auto";
    document.body.style.height = "auto";
    document.documentElement.classList.add("scrollable-page");
    document.body.classList.add("scrollable-page");

    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.style.overflow = "auto";
      rootElement.style.height = "auto";
      rootElement.style.position = "static";
      rootElement.style.width = "100%";
    }

    _preloadCreate().catch(() => {});

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;
      document.documentElement.classList.remove("scrollable-page");
      document.body.classList.remove("scrollable-page");
      if (rootElement) {
        rootElement.style.overflow = "";
        rootElement.style.height = "";
        rootElement.style.position = "";
        rootElement.style.width = "";
      }
    };
  }, []);

  const { data: collaborations, isLoading: isLoadingCollabs } = useQuery({
    queryKey: ["/api/collaborations/my"],
    queryFn: async () => {
      const data = (await apiRequest(
        "/api/collaborations/my"
      )) as CollaborationWithExtras[];
      const statusMap: Record<string, boolean> = {};
      data.forEach((c) => {
        statusMap[c.id] = c.status === "active";
      });
      setActiveCollabs(statusMap);
      return data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "paused" }) =>
      apiRequest(`/api/collaborations/${id}/status`, "PATCH", { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collaborations/my"] });
    },
  });

  const handleToggleActive = async (id: string, isActive: boolean) => {
    setActiveCollabs((prev) => ({ ...prev, [id]: isActive }));
    try {
      await toggleMutation.mutateAsync({
        id,
        status: isActive ? "active" : "paused",
      });
      toast({
        title: isActive ? "Live" : "Paused",
        description: isActive
          ? "Visible in the discover feed."
          : "Hidden from discovery.",
      });
    } catch (error) {
      setActiveCollabs((prev) => ({ ...prev, [id]: !isActive }));
      toast({
        variant: "destructive",
        title: "Couldn't update",
        description:
          error instanceof Error ? error.message : "Try again in a moment.",
      });
    }
  };

  const handleDeleteCollaboration = async () => {
    if (!collabToDelete) return;
    try {
      const headers: Record<string, string> = {};
      if (window.Telegram?.WebApp?.initData) {
        headers["x-telegram-init-data"] = window.Telegram.WebApp.initData;
      }
      const response = await fetch(`/api/collaborations/${collabToDelete}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      });
      if (!response.ok) {
        const body = await response.text();
        let msg = "Couldn't delete";
        try {
          const parsed = JSON.parse(body);
          msg = parsed.error || msg;
        } catch {
          if (body) msg = body;
        }
        throw new Error(msg);
      }
      toast({
        title: "Deleted",
        description: "Your collab is gone.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/collaborations/my"] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Couldn't delete",
        description:
          error instanceof Error ? error.message : "Try again in a moment.",
      });
    } finally {
      setCollabToDelete(null);
    }
  };

  const viewApplicationDetails = (application: ApplicationWithExtras) => {
    setSelectedApplication(application);
    setApplicationDialogOpen(true);
  };

  const patchApplication = async (
    applicationId: string,
    status: "approved" | "rejected"
  ) => {
    setProcessingApplicationId(applicationId);
    try {
      const res = await apiRequest(
        `/api/collaborations/applications/${applicationId}`,
        "PATCH",
        { status, message: feedbackMessage }
      );
      if (res.ok ?? true) {
        toast({
          title: status === "approved" ? "Approved" : "Declined",
          description: "The applicant has been notified.",
        });
        setApplicationDialogOpen(false);
        setSelectedApplication(null);
        setFeedbackMessage("");
        queryClient.invalidateQueries({ queryKey: ["/api/collaborations/my"] });
      } else {
        throw new Error("Failed");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Couldn't update",
        description:
          error instanceof Error ? error.message : "Try again in a moment.",
      });
    } finally {
      setProcessingApplicationId(null);
    }
  };

  const renderSkeletons = () => (
    <div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-start gap-3 border-b border-hairline py-5"
        >
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-full max-w-[280px]" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCollab = (collab: CollaborationWithExtras) => {
    const pending =
      collab.applications?.filter((a) => a.status === "pending") || [];
    const isActive = activeCollabs[collab.id] ?? collab.status === "active";
    const description =
      (collab.details && typeof collab.details === "object" &&
        "short_description" in collab.details &&
        collab.details.short_description) ||
      collab.description ||
      "";
    const title =
      collab.title && collab.title !== "Collaboration"
        ? collab.title
        : collab.collab_type;

    return (
      <article
        key={collab.id}
        className={`border-b border-hairline py-5 transition-colors duration-base ease-out ${
          highlightedCollabId === collab.id ? "bg-brand-subtle" : ""
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CollaborationTypePill typeId={collab.collab_type} />
              {highlightedCollabId === collab.id && (
                <span className="text-xs font-medium tabular text-brand">
                  New
                </span>
              )}
            </div>
            <h3 className="mt-2 text-md font-semibold text-text leading-snug">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-text-muted line-clamp-2 leading-snug">
                {description}
              </p>
            )}

            <div className="mt-3 flex items-center gap-3 text-xs tabular text-text-subtle">
              <span>
                {collab.date_type === "flexible" ? "Flexible" : "Scheduled"}
                {collab.date_type === "specific" && collab.specific_date
                  ? ` · ${new Date(collab.specific_date).toLocaleDateString()}`
                  : ""}
              </span>
              <span>·</span>
              <span>
                Posted {new Date(collab.created_at ?? Date.now()).toLocaleDateString()}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-text-muted">
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) =>
                    handleToggleActive(collab.id, checked)
                  }
                />
                {isActive ? "Live" : "Paused"}
              </label>

              {pending.length > 0 ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => viewApplicationDetails(pending[0])}
                  className="ml-auto"
                >
                  <Users className="h-4 w-4" />
                  {pending.length} request{pending.length > 1 ? "s" : ""}
                </Button>
              ) : (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Delete collab"
                  className="ml-auto text-text-subtle hover:text-destructive"
                  onClick={() => setCollabToDelete(collab.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  };

  const appData = selectedApplication?.application_data ?? {};

  return (
    <MobileCheck>
      <div className="min-h-[100svh] bg-background">
        <header className="flex items-center justify-between gap-2 border-b border-hairline bg-background px-4 py-3">
          <h1 className="text-xl font-semibold tracking-tight text-text">
            Your collabs
          </h1>
          <Button
            size="sm"
            onClick={() => setLocation("/create-collaboration-v2")}
          >
            <Plus className="h-4 w-4" />
            Post
          </Button>
        </header>

        <div className="mx-auto max-w-xl px-4">
          {isLoadingCollabs ? (
            renderSkeletons()
          ) : collaborations && collaborations.length > 0 ? (
            <div>{collaborations.map(renderCollab)}</div>
          ) : (
            <div className="py-12">
              <h3 className="text-lg font-semibold tracking-tight text-text">
                You haven't posted yet.
              </h3>
              <p className="mt-1 max-w-[42ch] text-sm text-text-muted">
                Post what you're looking for — collaborators will find you.
              </p>
              <Button
                size="sm"
                className="mt-4"
                onClick={() => setLocation("/create-collaboration-v2")}
              >
                <Plus className="h-4 w-4" />
                Post your first collab
              </Button>
            </div>
          )}
        </div>

        <Dialog
          open={applicationDialogOpen}
          onOpenChange={setApplicationDialogOpen}
        >
          <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review request</DialogTitle>
              <DialogDescription>
                Respond to this person's pitch.
              </DialogDescription>
            </DialogHeader>

            {selectedApplication && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider tabular text-text-subtle">
                    Status
                  </p>
                  <p className="mt-1 text-sm text-text">
                    {selectedApplication.status
                      ? selectedApplication.status.charAt(0).toUpperCase() +
                        selectedApplication.status.slice(1)
                      : "Pending"}
                  </p>
                </div>

                {selectedApplication.status === "pending" && (
                  <>
                    <Textarea
                      placeholder="Optional note to send back…"
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() =>
                          patchApplication(
                            selectedApplication.id,
                            "rejected"
                          )
                        }
                        disabled={!!processingApplicationId}
                      >
                        <UserX className="h-4 w-4" />
                        Decline
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() =>
                          patchApplication(
                            selectedApplication.id,
                            "approved"
                          )
                        }
                        disabled={!!processingApplicationId}
                      >
                        <UserCheck className="h-4 w-4" />
                        Accept
                      </Button>
                    </div>
                  </>
                )}

                <div className="space-y-3 border-t border-hairline pt-4">
                  {appData.reason && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider tabular text-text-subtle">
                        Why they're interested
                      </p>
                      <p className="mt-1 text-sm text-text">{appData.reason}</p>
                    </div>
                  )}
                  {appData.experience && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider tabular text-text-subtle">
                        Experience
                      </p>
                      <p className="mt-1 text-sm text-text">
                        {appData.experience}
                      </p>
                    </div>
                  )}
                  {appData.notes && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider tabular text-text-subtle">
                        Notes
                      </p>
                      <p className="mt-1 text-sm text-text">{appData.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setApplicationDialogOpen(false);
                  setSelectedApplication(null);
                  setFeedbackMessage("");
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={!!collabToDelete}
          onOpenChange={(open) => !open && setCollabToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this collab?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the post and cancels any pending requests. There's
                no undo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCollaboration}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MobileCheck>
  );
}
