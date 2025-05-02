import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "../components/PageHeader";

// Interface for component props
interface MyCollaborationsProps {
  collaborationId?: string;
}

// Potential match interface
interface PotentialMatch {
  id: string;
  swipe_id: string;
  user_id: string;
  collaboration_id: string;
  collaboration_type: string;
  collaboration_description?: string;
  collaboration_topics?: string[];
  swipe_direction: string;
  swipe_created_at: string;
  user_first_name: string;
  user_last_name?: string;
  user_twitter_followers?: string;
  company_name: string;
  company_job_title: string;
  company_twitter_followers?: string;
  requester_company: string;
  requester_role: string;
}

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { GlowButton } from "@/components/GlowButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MobileCheck } from "@/components/MobileCheck";
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

import {
  type Collaboration,
  type CollabApplication,
  type ApplicationData,
} from "@shared/schema";
import { Switch } from "@/components/ui/switch";

import {
  CalendarDays,
  Users,
  Coins,
  Clock,
  Check,
  X,
  Eye,
  MessageSquare,
  UserCheck,
  UserX,
  ListChecks,
  Trash2,
  Twitter,
  BookOpen,
  FileText,
  Mic,
  Video,
  Coffee,
  Mail,
  PenTool,
  Lock,
} from "lucide-react";

// Helper function to get appropriate icon based on collaboration type
const getCollabTypeIcon = (collabType: string) => {
  switch (collabType) {
    case "Podcast Guest Appearance":
    case "Podcast":
      return <Mic className="h-3 w-3" />;
    case "Twitter Spaces Guest":
    case "Twitter Space":
      return <Twitter className="h-3 w-3" />;
    case "Twitter Co-Marketing":
    case "Co-Marketing on Twitter":
      return <Twitter className="h-3 w-3" />;
    case "Live Stream Guest Appearance":
    case "Live Stream":
    case "Webinar":
      return <Video className="h-3 w-3" />;
    case "Report & Research Feature":
    case "Research Report":
      return <ListChecks className="h-3 w-3" />;
    case "Newsletter Feature":
    case "Newsletter":
      return <Mail className="h-3 w-3" />;
    case "Blog Post Feature":
    case "Blog Post":
      return <PenTool className="h-3 w-3" />;
    case "Conference Coffee":
      return <Coffee className="h-3 w-3" />;
    default:
      return <MessageSquare className="h-3 w-3" />;
  }
};

export default function MyCollaborationsNew({
  collaborationId,
}: MyCollaborationsProps = {}) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // This disables the default fixed positioning and overflow hidden
  // so that we can have a normal scrolling container with a scrollbar
  useEffect(() => {
    // Save the original style
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;

    // Modify for this page to allow scrolling
    document.body.style.overflow = "auto";
    document.body.style.position = "static";
    document.body.style.width = "auto";
    document.body.style.height = "auto";

    // Add scrollable-page class to html and body
    document.documentElement.classList.add("scrollable-page");
    document.body.classList.add("scrollable-page");

    // Also fix the root element
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.style.overflow = "auto";
      rootElement.style.height = "auto";
      rootElement.style.position = "static";
      rootElement.style.width = "100%";
    }

    // Restore original style when component unmounts
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

  // Delete collaboration dialog state
  const [collabToDelete, setCollabToDelete] = useState<string | null>(null);

  // Live collaborations toggle state
  const [activeCollabs, setActiveCollabs] = useState<Record<string, boolean>>(
    {},
  );

  // Application detail dialog state
  const [selectedApplication, setSelectedApplication] =
    useState<CollabApplication | null>(null);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);

  // Application status update
  const [processingApplicationId, setProcessingApplicationId] = useState<
    string | null
  >(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Prefetch strategy: Start loading most important data first
  // Fetch user's collaborations with optimized options
  const { data: collaborations, isLoading: isLoadingCollabs } = useQuery({
    queryKey: ["/api/collaborations/my"],
    queryFn: async () => {
      try {
        // Use the standardized apiRequest function to ensure Telegram headers are included
        const data = await apiRequest("/api/collaborations/my");

        // Initialize activeCollabs state based on fetched data
        const statusMap: Record<string, boolean> = {};
        data.forEach((collab: Collaboration) => {
          statusMap[collab.id] = collab.status === "active";
        });
        setActiveCollabs(statusMap);

        return data as Collaboration[];
      } catch (error) {
        console.error("Error fetching collaborations:", error);
        throw error;
      }
    },
    // Explicitly configure to prevent React Query background updates
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });

  // Fetch user's applications with deferred priority
  const { data: applications, isLoading: isLoadingApps } = useQuery({
    queryKey: ["/api/my-applications"],
    queryFn: async () => {
      try {
        // Use the standardized apiRequest function to ensure Telegram headers are included
        const data = await apiRequest("/api/my-applications");
        return data as CollabApplication[];
      } catch (error) {
        console.error("Error fetching applications:", error);
        throw error;
      }
    },
    // Configure React Query to load this data only after collaborations are loaded
    enabled: !isLoadingCollabs,
    staleTime: Infinity,
  });

  // Fetch potential matches with lowest priority
  const { data: potentialMatches, isLoading: isLoadingMatches } = useQuery({
    queryKey: ["/api/potential-matches"],
    queryFn: async () => {
      try {
        // Use the standardized apiRequest function to ensure Telegram headers are included
        const data = await apiRequest("/api/potential-matches");
        return data as PotentialMatch[];
      } catch (error) {
        console.error("Error fetching potential matches:", error);
        return [] as PotentialMatch[]; // Return empty array on error to avoid breaking the UI
      }
    },
    // Configure React Query to load this data only after applications are loaded
    enabled: !isLoadingApps && !isLoadingCollabs,
    staleTime: Infinity,
  });

  // Handle approving an application
  const handleApproveApplication = async (applicationId: string) => {
    setProcessingApplicationId(applicationId);
    try {
      const response = await apiRequest(
        `/api/collaborations/applications/${applicationId}`,
        "PATCH",
        {
          status: "approved",
          message: feedbackMessage,
        },
      );

      if (response.ok) {
        toast({
          title: "Application Approved",
          description: "The applicant has been notified of your decision.",
          duration: 2000, // Auto-dismiss after 2 seconds
        });

        // Close dialog and reset state
        setApplicationDialogOpen(false);
        setSelectedApplication(null);
        setFeedbackMessage("");

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/collaborations/my"] });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to approve application");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to approve application",
        variant: "destructive",
      });
    } finally {
      setProcessingApplicationId(null);
    }
  };

  // Handle rejecting an application
  const handleRejectApplication = async (applicationId: string) => {
    setProcessingApplicationId(applicationId);
    try {
      const response = await apiRequest(
        `/api/collaborations/applications/${applicationId}`,
        "PATCH",
        {
          status: "rejected",
          message: feedbackMessage,
        },
      );

      if (response.ok) {
        toast({
          title: "Application Rejected",
          description: "The applicant has been notified of your decision.",
          duration: 2000, // Auto-dismiss after 2 seconds
        });

        // Close dialog and reset state
        setApplicationDialogOpen(false);
        setSelectedApplication(null);
        setFeedbackMessage("");

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/collaborations/my"] });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reject application");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to reject application",
        variant: "destructive",
      });
    } finally {
      setProcessingApplicationId(null);
    }
  };

  // View application details
  const viewApplicationDetails = (application: CollabApplication) => {
    setSelectedApplication(application);
    setApplicationDialogOpen(true);
  };

  // Handle toggling collaboration active state
  const toggleCollaborationMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "active" | "paused";
    }) => {
      // The apiRequest function already handles the response.ok check and JSON parsing
      return await apiRequest(`/api/collaborations/${id}/status`, "PATCH", {
        status,
      });
    },
    onSuccess: () => {
      // Invalidate and refetch queries related to collaborations
      queryClient.invalidateQueries({ queryKey: ["/api/collaborations/my"] });
    },
  });

  // Handle toggling collaboration active state
  const handleToggleActive = async (collabId: string, isActive: boolean) => {
    // Update local state immediately for responsive UI
    setActiveCollabs((prev) => ({
      ...prev,
      [collabId]: isActive,
    }));

    try {
      await toggleCollaborationMutation.mutateAsync({
        id: collabId,
        status: isActive ? "active" : "paused",
      });

      toast({
        title: isActive ? "Collaboration Activated" : "Collaboration Paused",
        description: isActive
          ? "Your collaboration is now visible to potential partners"
          : "Your collaboration is now hidden from discovery",
        duration: 3000,
      });
    } catch (error) {
      // Revert local state if the API call fails
      setActiveCollabs((prev) => ({
        ...prev,
        [collabId]: !isActive,
      }));

      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update collaboration status",
        variant: "destructive",
      });
    }
  };

  // Handle deleting a collaboration
  const handleDeleteCollaboration = async () => {
    if (!collabToDelete) return;

    try {
      const response = await apiRequest(
        `/api/collaborations/${collabToDelete}`,
        "DELETE",
      );

      if (response.ok) {
        toast({
          title: "Collaboration Deleted",
          description: "Your collaboration has been deleted successfully",
          duration: 2000, // Auto-dismiss after 2 seconds
        });

        // Refresh the collaborations data
        queryClient.invalidateQueries({ queryKey: ["/api/collaborations/my"] });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete collaboration");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete collaboration",
        variant: "destructive",
      });
    } finally {
      // Reset the delete state
      setCollabToDelete(null);
    }
  };

  // Auto-redirect to collaboration creation form when user has no collaborations
  useEffect(() => {
    if (collaborations && collaborations.length === 0) {
      // Redirect directly to the first page of collaboration creation form
      setLocation("/create-collaboration-v2");
    }
  }, [collaborations, setLocation]);

  // Return JSX with skeletons instead of loading screen
  return (
    <MobileCheck>
      <div className="min-h-[100svh] bg-background">
        <PageHeader title="My Collabs" />

        <div className="container mx-auto py-4 px-4">
          {!collaborations ? (
            // Show skeletons instead of loading screen
            <div>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="mb-4">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-20 mb-2" />
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : collaborations.length > 0 ? (
            <div>
              <div className="my-8 py-4 flex justify-center">
                <GlowButton
                  onClick={() => setLocation("/create-collaboration-v2")}
                  className="w-full max-w-md py-6"
                >
                  Create New Collab
                </GlowButton>
              </div>
              {collaborations.map((collab) => {
                // Check if there are any pending applications
                const pendingApplications =
                  collab.applications?.filter(
                    (app) => app.status === "pending",
                  ) || [];
                const hasApplications = pendingApplications.length > 0;

                // Get active state from local state or default to true
                const isActive =
                  activeCollabs[collab.id] !== undefined
                    ? activeCollabs[collab.id]
                    : collab.status === "active";

                return (
                  <Card key={collab.id} className="mb-4">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge className="mb-2 flex items-center gap-1">
                            {getCollabTypeIcon(collab.collab_type)}
                            {collab.collab_type}
                          </Badge>
                          <CardTitle className="text-xl">
                            {(collab as any).title === "Collaboration"
                              ? collab.collab_type
                              : (collab as any).title}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasApplications && (
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              <Users className="h-3 w-3" />{" "}
                              {pendingApplications.length} application
                              {pendingApplications.length !== 1 ? "s" : ""}
                            </Badge>
                          )}
                          {!hasApplications && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50/50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCollabToDelete(collab.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      {/* Display short description if available */}
                      {collab.details && typeof collab.details === "object" && (
                        <div className="mb-4">
                          {/* Podcast guest appearance should show podcast name */}
                          {collab.collab_type === "Podcast Guest Appearance" &&
                            "podcast_name" in collab.details && (
                              <div className="mb-2">
                                <p className="text-sm font-medium">
                                  Podcast:{" "}
                                  {(collab.details as any).podcast_name}
                                </p>
                                {"estimated_reach" in collab.details &&
                                  (collab.details as any).estimated_reach && (
                                    <p className="text-xs text-gray-600 mb-1">
                                      Audience:{" "}
                                      {(collab.details as any).estimated_reach}
                                    </p>
                                  )}
                              </div>
                            )}

                          {/* Show topics if available */}
                          {collab.topics && collab.topics.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 mb-1">
                                Topics:
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {collab.topics.map((topic, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-transparent text-gray-500 border border-[#6B7280] text-xs rounded-full"
                                  >
                                    {topic}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Description */}
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {"short_description" in collab.details &&
                            (collab.details as any).short_description
                              ? (collab.details as any).short_description
                              : collab.description ||
                                "No description available"}
                          </p>
                        </div>
                      )}

                      {/* Active toggle */}
                      <div className="flex items-center justify-between border-t pt-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={isActive}
                            onCheckedChange={(checked) =>
                              handleToggleActive(collab.id, checked)
                            }
                          />
                          <span className="text-sm font-medium">
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div>
                          <Badge
                            variant={isActive ? "default" : "outline"}
                            className="text-xs"
                          >
                            {isActive ? "Live" : "Paused"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <div className="flex flex-wrap gap-2 w-full">
                        {hasApplications && (
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                              setLocation(
                                `/collaboration/${collab.id}/applications`,
                              )
                            }
                          >
                            <ListChecks className="h-4 w-4 mr-1" />
                            View Applications
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center pt-4 pb-4 px-4 border rounded-xl shadow-sm bg-gradient-to-b from-background to-muted/20">
              {/* Collaboration Steps Section */}
              <div className="mb-4 text-left">
                <h3 className="text-base font-medium mb-2 pl-2">
                  How Collaborations Work
                </h3>
                <div className="flex flex-col gap-4">
                  {/* Step 1 */}
                  <div className="flex items-start border border-muted-foreground/10 rounded-lg overflow-hidden">
                    <div className="bg-primary/65 flex-shrink-0 w-14 h-full min-h-[4rem] flex items-center justify-center relative">
                      <span className="font-bold text-xl text-primary-foreground">
                        1
                      </span>
                      <div className="absolute right-0 w-3 h-3 bg-primary/65 rotate-45 translate-x-1/2"></div>
                    </div>
                    <div
                      className="p-3 text-left w-full"
                      style={{ maxWidth: "calc(100% - 3.5rem)" }}
                    >
                      <h4 className="font-medium text-sm">
                        Create Your Collab
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Choose from Twitter Collabs, reports, newsletters,
                        podcasts, etc.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start border border-muted-foreground/10 rounded-lg overflow-hidden">
                    <div className="bg-primary/65 flex-shrink-0 w-14 h-full min-h-[4rem] flex items-center justify-center relative">
                      <span className="font-bold text-xl text-primary-foreground">
                        2
                      </span>
                      <div className="absolute right-0 w-3 h-3 bg-primary/65 rotate-45 translate-x-1/2"></div>
                    </div>
                    <div
                      className="p-3 text-left w-full"
                      style={{ maxWidth: "calc(100% - 3.5rem)" }}
                    >
                      <h4 className="font-medium text-sm">
                        Approve or Pass Collab Requests
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        You'll be notified when others request to join your
                        collab.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start border border-muted-foreground/10 rounded-lg overflow-hidden">
                    <div className="bg-primary/65 flex-shrink-0 w-14 h-full min-h-[4rem] flex items-center justify-center relative">
                      <span className="font-bold text-xl text-primary-foreground">
                        3
                      </span>
                      <div className="absolute right-0 w-3 h-3 bg-primary/65 rotate-45 translate-x-1/2"></div>
                    </div>
                    <div
                      className="p-3 text-left w-full"
                      style={{ maxWidth: "calc(100% - 3.5rem)" }}
                    >
                      <h4 className="font-medium text-sm">
                        Chat with Your New Match
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        You'll be able to chat directly in Telegram with your
                        new collaborator.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom CTA Button */}
              <Button
                onClick={() => setLocation("/create-collaboration-v2")}
                className="w-full max-w-xs py-3 mx-auto mb-6 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Create Your First Collab
              </Button>

              {/* Privacy Section */}
              <div className="flex flex-col items-center">
                <div className="flex items-stretch border border-muted-foreground/10 rounded-lg overflow-hidden">
                  <div className="bg-yellow-500/65 flex-shrink-0 w-14 flex items-center justify-center">
                    <span className="text-white">
                      <Lock size={18} />
                    </span>
                  </div>
                  <div
                    className="p-3 text-left w-full"
                    style={{ maxWidth: "calc(100% - 3.5rem)" }}
                  >
                    <p className="text-xs flex flex-col gap-1">
                      <strong>PRIVACY FIRST</strong>
                      <span className="text-muted-foreground">
                        Contact details shared only upon successful match.
                        Anyone you passed on won't be notified.
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!collabToDelete}
          onOpenChange={(open) => !open && setCollabToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Collaboration</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this
                collaboration and remove its data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCollaboration}
                className="bg-red-500 hover:bg-red-600"
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
