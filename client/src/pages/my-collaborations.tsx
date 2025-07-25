import { useState, useEffect, lazy, Suspense } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "../components/PageHeader";

// Preload the CreateCollaborationV2 component
const CreateCollaborationV2 = lazy(() => import("./create-collaboration-v2"));

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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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



// We're using PageHeader imported at the top of the file
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
  type ApplicationData 
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
  Lock
} from "lucide-react";

// Helper function to get appropriate icon based on collaboration type
const getCollabTypeIcon = (collabType: string) => {
  switch(collabType) {
    case 'Podcast Guest Appearance':
    case 'Podcast':
      return <Mic className="h-3 w-3" />;
    case 'Twitter Spaces Guest':
    case 'Twitter Space':
      return <Twitter className="h-3 w-3" />;
    case 'Twitter Co-Marketing':
    case 'Co-Marketing on Twitter':
      return <Twitter className="h-3 w-3" />;
    case 'Live Stream Guest Appearance':
    case 'Live Stream':
    case 'Webinar':
      return <Video className="h-3 w-3" />;
    case 'Report & Research Feature':
    case 'Research Report':
      return <ListChecks className="h-3 w-3" />;
    case 'Newsletter Feature':
    case 'Newsletter':
      return <Mail className="h-3 w-3" />;
    case 'Blog Post Feature':
    case 'Blog Post':
      return <PenTool className="h-3 w-3" />;
    case 'Conference Coffee':
      return <Coffee className="h-3 w-3" />;
    default:
      return <MessageSquare className="h-3 w-3" />;
  }
};

export default function MyCollaborations({ collaborationId }: MyCollaborationsProps = {}) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State to control the preloaded component visibility
  const [showCreateCollab, setShowCreateCollab] = useState(false);
  

  
  // State for highlighting newly created collaborations
  const [highlightedCollabId, setHighlightedCollabId] = useState<string | null>(null);
  
  // Check for new collaboration ID in URL parameters or localStorage
  useEffect(() => {
    // Check URL parameters for new collaboration ID
    const urlParams = new URLSearchParams(window.location.search);
    const newCollabId = urlParams.get('newCollab');
    
    // Also check localStorage for new collaboration ID (fallback)
    const storedNewCollabId = localStorage.getItem('newCollaborationId');
    
    const collabToHighlight = newCollabId || storedNewCollabId;
    
    if (collabToHighlight) {
      setHighlightedCollabId(collabToHighlight);
      
      // Clear from localStorage if it was stored there
      if (storedNewCollabId) {
        localStorage.removeItem('newCollaborationId');
      }
      
      // Clear from URL parameters if present
      if (newCollabId) {
        const url = new URL(window.location.href);
        url.searchParams.delete('newCollab');
        window.history.replaceState({}, '', url.toString());
      }
      
      // Clear highlighting after 5 seconds
      setTimeout(() => {
        setHighlightedCollabId(null);
      }, 5000);
    }
  }, []);
  
  // This disables the default fixed positioning and overflow hidden
  // so that we can have a normal scrolling container with a scrollbar
  useEffect(() => {
    // Save the original style
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;
    
    // Modify for this page to allow scrolling
    document.body.style.overflow = 'auto';
    document.body.style.position = 'static';
    document.body.style.width = 'auto';
    document.body.style.height = 'auto';
    
    // Add scrollable-page class to html and body
    document.documentElement.classList.add('scrollable-page');
    document.body.classList.add('scrollable-page');
    
    // Also fix the root element
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.style.overflow = 'auto';
      rootElement.style.height = 'auto';
      rootElement.style.position = 'static';
      rootElement.style.width = '100%';
    }
    
    // Preload the create collaboration page for faster navigation
    const preloadCollabPage = async () => {
      try {
        await import("./create-collaboration-v2");
        console.log("Create collaboration page preloaded");
      } catch (error) {
        console.error("Failed to preload page:", error);
      }
    };
    
    // Start preloading
    preloadCollabPage();
    
    // Restore original style when component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;
      document.documentElement.classList.remove('scrollable-page');
      document.body.classList.remove('scrollable-page');
      
      if (rootElement) {
        rootElement.style.overflow = '';
        rootElement.style.height = '';
        rootElement.style.position = '';
        rootElement.style.width = '';
      }
    };
  }, []);
  
  // Delete collaboration dialog state
  const [collabToDelete, setCollabToDelete] = useState<string | null>(null);
  
  // Live collaborations toggle state
  const [activeCollabs, setActiveCollabs] = useState<Record<string, boolean>>({});
  
  // Application detail dialog state
  const [selectedApplication, setSelectedApplication] = useState<CollabApplication | null>(null);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  
  // Application status update
  const [processingApplicationId, setProcessingApplicationId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  

  
  // Prefetch strategy: Start loading most important data first
  // Fetch user's collaborations with optimized options
  const { data: collaborations, isLoading: isLoadingCollabs } = useQuery({
    queryKey: ['/api/collaborations/my'],
    queryFn: async () => {
      try {
        // Use the standardized apiRequest function to ensure Telegram headers are included
        const data = await apiRequest('/api/collaborations/my');
        
        // Initialize activeCollabs state based on fetched data
        const statusMap: Record<string, boolean> = {};
        data.forEach((collab: Collaboration) => {
          statusMap[collab.id] = collab.status === 'active';
        });
        setActiveCollabs(statusMap);
        
        return data as Collaboration[];
      } catch (error) {
        console.error("Error fetching collaborations:", error);
        throw error;
      }
    },
    // Allow proper invalidation while preventing unnecessary background updates
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Allow refetch on mount for invalidation
    refetchOnReconnect: false,
    refetchInterval: false
  });
  
  // Fetch user's applications with deferred priority
  const { data: applications, isLoading: isLoadingApps } = useQuery({
    queryKey: ['/api/my-applications'],
    queryFn: async () => {
      try {
        // Use the standardized apiRequest function to ensure Telegram headers are included
        const data = await apiRequest('/api/my-applications');
        return data as CollabApplication[];
      } catch (error) {
        console.error("Error fetching applications:", error);
        throw error;
      }
    },
    // Configure React Query to load this data only after collaborations are loaded
    enabled: !isLoadingCollabs,
    staleTime: Infinity
  });
  
  // Fetch potential matches with lowest priority
  const { data: potentialMatches, isLoading: isLoadingMatches } = useQuery({
    queryKey: ['/api/potential-matches'],
    queryFn: async () => {
      try {
        // Use the standardized apiRequest function to ensure Telegram headers are included
        const data = await apiRequest('/api/potential-matches');
        return data as PotentialMatch[];
      } catch (error) {
        console.error("Error fetching potential matches:", error);
        return [] as PotentialMatch[]; // Return empty array on error to avoid breaking the UI
      }
    },
    // Configure React Query to load this data only after applications are loaded
    enabled: !isLoadingApps && !isLoadingCollabs,
    staleTime: Infinity
  });


  
  // Handle approving an application
  const handleApproveApplication = async (applicationId: string) => {
    setProcessingApplicationId(applicationId);
    try {
      const response = await apiRequest(
        `/api/collaborations/applications/${applicationId}`, 
        'PATCH',
        { 
          status: 'approved',
          message: feedbackMessage 
        }
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
        queryClient.invalidateQueries({ queryKey: ['/api/collaborations/my'] });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve application');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve application",
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
        'PATCH',
        { 
          status: 'rejected',
          message: feedbackMessage 
        }
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
        queryClient.invalidateQueries({ queryKey: ['/api/collaborations/my'] });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject application');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject application",
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
    mutationFn: async ({ id, status }: { id: string, status: 'active' | 'paused' }) => {
      // The apiRequest function already handles the response.ok check and JSON parsing
      return await apiRequest(`/api/collaborations/${id}/status`, 'PATCH', { status });
    },
    onSuccess: () => {
      // Invalidate and refetch queries related to collaborations
      queryClient.invalidateQueries({ queryKey: ['/api/collaborations/my'] });
    }
  });

  // Handle toggling collaboration active state
  const handleToggleActive = async (collabId: string, isActive: boolean) => {
    // Update local state immediately for responsive UI
    setActiveCollabs(prev => ({
      ...prev,
      [collabId]: isActive
    }));
    
    try {
      await toggleCollaborationMutation.mutateAsync({
        id: collabId,
        status: isActive ? 'active' : 'paused'
      });
      
      toast({
        title: isActive ? "Collaboration Activated" : "Collaboration Paused",
        description: isActive 
          ? "Your collaboration is now visible to potential partners" 
          : "Your collaboration is now hidden from discovery",
        duration: 3000
      });
    } catch (error) {
      // Revert local state if the API call fails
      setActiveCollabs(prev => ({
        ...prev,
        [collabId]: !isActive
      }));
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update collaboration status",
        variant: "destructive",
      });
    }
  };
  
  // Handle deleting a collaboration
  const handleDeleteCollaboration = async () => {
    if (!collabToDelete) return;
    
    try {
      // Use direct fetch instead of apiRequest to handle the response manually
      const headers: Record<string, string> = {};
      
      // Add Telegram authentication header if available
      if (window.Telegram?.WebApp?.initData) {
        headers['x-telegram-init-data'] = window.Telegram.WebApp.initData;
      }
      
      // Make the DELETE request directly
      const response = await fetch(`/api/collaborations/${collabToDelete}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });
      
      if (response.ok) {
        toast({
          title: "Collaboration Deleted",
          description: "Your collaboration has been deleted successfully",
          duration: 2000, // Auto-dismiss after 2 seconds
        });
        
        // Refresh the collaborations data
        queryClient.invalidateQueries({ queryKey: ['/api/collaborations/my'] });
      } else {
        // Try to parse error response if available
        const errorText = await response.text();
        let errorMessage = 'Failed to delete collaboration';
        
        try {
          // Only try to parse as JSON if it looks like JSON
          if (errorText && (errorText.startsWith('{') || errorText.startsWith('['))) {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          }
        } catch (parseError) {
          // If JSON parsing fails, use the raw error text if available
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete collaboration",
        variant: "destructive",
      });
    } finally {
      // Reset the delete state
      setCollabToDelete(null);
    }
  };

  // Handle navigation to create collaboration page
  const handleNavigateToCreateCollab = () => {
    // Navigate immediately to the create page which is preloaded
    setLocation('/create-collaboration-v2');
  };

  // If showing create collab, render that component instead
  if (showCreateCollab) {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-pulse">Loading form...</div>
        </div>
      }>
        <CreateCollaborationV2 />
      </Suspense>
    );
  }

  // Render a collaboration card
  const renderCollaborationCard = (collab: Collaboration) => {
    // Check if there are any pending applications
    const pendingApplications = collab.applications?.filter(app => app.status === 'pending') || [];
    const hasApplications = pendingApplications.length > 0;
    
    // Get active state from local state or default to true
    const isActive = activeCollabs[collab.id] !== undefined 
      ? activeCollabs[collab.id] 
      : collab.status === 'active';
    
    return (
      <Card 
        key={collab.id} 
        className={`mb-4 transition-all duration-500 ${
          highlightedCollabId === collab.id 
            ? 'ring-2 ring-primary ring-offset-2 bg-primary/5 animate-pulse' 
            : ''
        }`}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="flex items-center gap-1">
                  {getCollabTypeIcon(collab.collab_type)}
                  {collab.collab_type}
                </Badge>
                {highlightedCollabId === collab.id && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 animate-pulse">
                    ✨ New
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl">
                {collab.title === "Collaboration" ? collab.collab_type : collab.title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {hasApplications && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {pendingApplications.length} application{pendingApplications.length !== 1 ? 's' : ''}
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
          {collab.details && typeof collab.details === 'object' && (
            <div className="mb-4">
              {/* Podcast guest appearance should show podcast name */}
              {collab.collab_type === 'Podcast Guest Appearance' && 'podcast_name' in collab.details && (
                <div className="mb-2">
                  <p className="text-sm font-medium">Podcast: {collab.details.podcast_name}</p>
                  {'estimated_reach' in collab.details && collab.details.estimated_reach && (
                    <p className="text-xs text-gray-600 mb-1">Audience: {collab.details.estimated_reach}</p>
                  )}
                </div>
              )}
              
              {/* Show topics if available */}
              {collab.topics && collab.topics.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Topics:</p>
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
              
              {/* Display description - making sure it always shows */}
              {(
                <p className="text-sm text-gray-600 line-clamp-3">
                  {'short_description' in collab.details && collab.details.short_description ? 
                    collab.details.short_description : 
                    (collab.description || 'No description available')
                  }
                </p>
              )}
            </div>
          )}
          
          {/* Collaboration-specific details based on type */}
          {collab.details && typeof collab.details === 'object' && (
            <>
              {/* Only show the box if there is actual content to display */}
              {((collab.collab_type === 'Podcast' && 'podcast_name' in collab.details) ||
                (collab.collab_type === 'Twitter Space') ||
                (collab.collab_type === 'Twitter Co-Marketing') ||
                (collab.collab_type === 'Co-Marketing on Twitter') ||
                (collab.collab_type === 'Newsletter' && 'newsletter_name' in collab.details) ||
                ('expectations' in collab.details && collab.details.expectations) ||
                (collab.topics && collab.topics.length > 0)) && (
                <div className="mb-2 space-y-3">
                  {/* Podcast details */}
                  {collab.collab_type === 'Podcast' && 'podcast_name' in collab.details && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Podcast: {collab.details.podcast_name}</p>
                      {'estimated_reach' in collab.details && collab.details.estimated_reach && (
                        <p className="text-xs text-muted-foreground">Audience: {collab.details.estimated_reach}</p>
                      )}
                    </div>
                  )}
                  
                  {/* Twitter Spaces details */}
                  {collab.collab_type === 'Twitter Space' && (
                    <div className="space-y-2">
                      {'host_handle' in collab.details && collab.details.host_handle && (
                        <p className="text-sm font-medium">Host: {collab.details.host_handle}</p>
                      )}
                      {'topic' in collab.details && collab.details.topic && (
                        <p className="text-xs text-muted-foreground">Topic: {collab.details.topic}</p>
                      )}
                      {'host_followers' in collab.details && collab.details.host_followers && (
                        <p className="text-xs text-muted-foreground">Host Followers: {collab.details.host_followers}</p>
                      )}
                      {/* Topics not shown here since they are already at the top */}
                    </div>
                  )}
                  
                  {/* Twitter Co-Marketing details */}
                  {(collab.collab_type === 'Twitter Co-Marketing' || collab.collab_type === 'Co-Marketing on Twitter') && (
                    <div className="space-y-2">
                      {'account_handle' in collab.details && collab.details.account_handle && (
                        <p className="text-sm font-medium">Account: {collab.details.account_handle}</p>
                      )}
                      {'twitter_url' in collab.details && collab.details.twitter_url && (
                        <p className="text-sm font-medium">
                          <a 
                            href={collab.details.twitter_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline flex items-center"
                          >
                            <Twitter className="h-3 w-3 mr-1" />
                            @{collab.details.twitter_url.split('/').pop()}
                          </a>
                        </p>
                      )}
                      {'followers_count' in collab.details && collab.details.followers_count && (
                        <p className="text-xs text-muted-foreground">Follower Count: {collab.details.followers_count}</p>
                      )}
                      {'collaboration_types' in collab.details && Array.isArray(collab.details.collaboration_types) && collab.details.collaboration_types.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">Collaboration Types:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {collab.details.collaboration_types.map((type: string, idx: number) => (
                              <span 
                                key={idx} 
                                className="px-2 py-0.5 bg-accent text-accent-foreground text-xs rounded-full"
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Topics not shown here since they are already at the top */}
                    </div>
                  )}
                  
                  {/* Newsletter details */}
                  {collab.collab_type === 'Newsletter' && 'newsletter_name' in collab.details && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Newsletter: {collab.details.newsletter_name}</p>
                      {'total_subscribers' in collab.details && collab.details.total_subscribers && (
                        <p className="text-xs text-muted-foreground">Subscribers: {collab.details.total_subscribers}</p>
                      )}
                    </div>
                  )}
                  
                  {/* Show any expectations if available */}
                  {'expectations' in collab.details && collab.details.expectations && (
                    <div className="mt-2">
                      <p className="text-xs font-medium">Expectations:</p>
                      <p className="text-xs text-muted-foreground">{collab.details.expectations}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <CalendarDays className="h-3 w-3" />
              <span>{collab.date_type === 'flexible' ? 'Flexible timing' : 'Specific date'}</span>
              {collab.date_type === 'specific' && collab.specific_date && (
                <span className="ml-1">{new Date(collab.specific_date).toLocaleDateString()}</span>
              )}
            </div>
            
            {collab.has_compensation && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Coins className="h-3 w-3" />
                <span>Paid opportunity</span>
              </div>
            )}
            
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Created on {new Date(collab.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          
          {/* Active toggle */}
          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex items-center space-x-2">
              <Switch 
                checked={isActive}
                onCheckedChange={(checked) => handleToggleActive(collab.id, checked)}
              />
              <span className="text-sm font-medium">
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <Badge 
                variant={isActive ? "default" : "outline"}
                className="text-xs"
              >
                {isActive ? 'Live' : 'Paused'}
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
                onClick={() => setLocation(`/collaboration/${collab.id}/applications`)}
              >
                <ListChecks className="h-4 w-4 mr-1" /> 
                View Applications
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  };
  
  // Render an application card
  const renderApplicationCard = (application: CollabApplication) => {
    // Parse the application data with safe defaults
    let applicationData: ApplicationData = {
      reason: '',
      experience: '',
      portfolioLinks: '',
      twitterHandle: '',
      githubHandle: '',
      notes: ''
    } as ApplicationData;
    
    try {
      if (application.application_data && typeof application.application_data === 'object') {
        applicationData = { ...applicationData, ...(application.application_data as ApplicationData) };
      }
    } catch (error) {
      console.error("Error parsing application data:", error);
    }
    
    // Get status badge variant
    const getStatusBadge = () => {
      switch (application.status) {
        case 'approved':
          return (
            <Badge variant="success" className="flex items-center gap-1">
              <Check className="h-3 w-3" /> Approved
            </Badge>
          );
        case 'rejected':
          return (
            <Badge variant="destructive" className="flex items-center gap-1">
              <X className="h-3 w-3" /> Rejected
            </Badge>
          );
        default:
          return (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Pending
            </Badge>
          );
      }
    };
    
    return (
      <Card key={application.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">
                Applied on {new Date(application.created_at).toLocaleDateString()}
              </p>
              <CardTitle className="text-xl">
                {application.collaboration?.title || "Collaboration Title"}
              </CardTitle>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          {applicationData.reason && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-1">Your reason for applying:</p>
              <p className="text-sm text-gray-600 line-clamp-3">{applicationData.reason}</p>
            </div>
          )}
          
          {applicationData.experience && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-1">Your experience:</p>
              <p className="text-sm text-gray-600 line-clamp-2">{applicationData.experience}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline"
            className="w-full"
            onClick={() => viewApplicationDetails(application)}
          >
            <Eye className="h-4 w-4 mr-1" /> View Details
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  // Render application details in dialog
  const renderApplicationDetails = () => {
    if (!selectedApplication) return null;
    
    // Parse the application data with safe defaults
    let applicationData: ApplicationData = {
      reason: '',
      experience: '',
      portfolioLinks: '',
      twitterHandle: '',
      githubHandle: '',
      notes: ''
    } as ApplicationData;
    
    try {
      if (selectedApplication.application_data && typeof selectedApplication.application_data === 'object') {
        applicationData = { ...applicationData, ...(selectedApplication.application_data as ApplicationData) };
      }
    } catch (error) {
      console.error("Error parsing application data:", error);
    }
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-1">Application Status</h3>
          <Badge 
            variant={
              selectedApplication.status === 'approved' ? 'success' : 
              selectedApplication.status === 'rejected' ? 'destructive' : 
              'outline'
            }
          >
            {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
          </Badge>
        </div>
        
        {selectedApplication.status === 'pending' && (
          <>
            <Separator />
            
            <div>
              <h3 className="font-medium mb-3">Review Application</h3>
              
              <div className="flex flex-col gap-4 mb-4">
                <Textarea
                  placeholder="Optional feedback to the applicant..."
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  className="min-h-[80px]"
                />
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleRejectApplication(selectedApplication.id)}
                    disabled={!!processingApplicationId}
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button 
                    variant="default" 
                    className="flex-1"
                    onClick={() => handleApproveApplication(selectedApplication.id)}
                    disabled={!!processingApplicationId}
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </div>
              </div>
              
              <Separator />
            </div>
          </>
        )}
        
        <div>
          <h3 className="font-medium mb-2">Application Details</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Why they're interested:</p>
              <p className="text-sm text-gray-600">{applicationData.reason}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-1">Their experience:</p>
              <p className="text-sm text-gray-600">{applicationData.experience}</p>
            </div>
            
            {applicationData.portfolioLinks && (
              <div>
                <p className="text-sm font-medium mb-1">Portfolio Links:</p>
                <div className="text-sm">
                  {applicationData.portfolioLinks.split('\n').map((link, idx) => (
                    <a 
                      key={idx} 
                      href={link.startsWith('http') ? link : `https://${link}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block text-blue-600 hover:underline mb-1"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              {applicationData.twitterHandle && (
                <div>
                  <p className="text-sm font-medium mb-1">Twitter:</p>
                  <a 
                    href={`https://twitter.com/${applicationData.twitterHandle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {applicationData.twitterHandle}
                  </a>
                </div>
              )}
              
              {applicationData.githubHandle && (
                <div>
                  <p className="text-sm font-medium mb-1">GitHub:</p>
                  <a 
                    href={`https://github.com/${applicationData.githubHandle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {applicationData.githubHandle}
                  </a>
                </div>
              )}
            </div>
            
            {applicationData.notes && (
              <div>
                <p className="text-sm font-medium mb-1">Additional Notes:</p>
                <p className="text-sm text-gray-600">{applicationData.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Loading skeletons
  const renderSkeletons = () => (
    <div className="space-y-6">
      {[1, 2, 3].map(i => (
        <Card key={i} className="mb-4">
          <CardHeader>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex gap-2 w-full">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
  
  // Use the PageHeader component

  return (
    <MobileCheck>
      <div className="min-h-[100svh] bg-background">
        <PageHeader 
          title="My Collabs" 
        />
        
        <div className="container mx-auto py-4 px-4">
          {/* Main Content - Overview */}
          <div className="mt-6">
            {isLoadingCollabs ? (
              renderSkeletons()
            ) : collaborations && collaborations.length > 0 ? (
              <div>
                <div className="my-8 py-4 flex justify-center">
                  <GlowButton 
                    onClick={handleNavigateToCreateCollab}
                    className="w-full max-w-md py-6"
                  >
                    Create New Collab
                  </GlowButton>
                </div>
                {collaborations.map(collab => renderCollaborationCard(collab))}
              </div>
            ) : (
              <div className="text-center pt-4 pb-4 px-4 border rounded-xl shadow-sm bg-gradient-to-b from-background to-muted/20">
            {/* Collaboration Steps Section */}
            <div className="mb-4 text-left">
              <h3 className="text-base font-medium mb-2 pl-2">How Collaborations Work</h3>
              <div className="flex flex-col gap-4">
                {/* Step 1 */}
                <div className="flex items-start border border-muted-foreground/10 rounded-lg overflow-hidden">
                  <div className="bg-primary/65 flex-shrink-0 w-14 h-full min-h-[4rem] flex items-center justify-center relative">
                    <span className="font-bold text-xl text-primary-foreground">1</span>
                    <div className="absolute right-0 w-3 h-3 bg-primary/65 rotate-45 translate-x-1/2"></div>
                  </div>
                  <div className="p-3 text-left w-full" style={{ maxWidth: "calc(100% - 3.5rem)" }}>
                    <h4 className="font-medium text-sm">Create Your Collab</h4>
                    <p className="text-xs text-muted-foreground">
                      Choose from Twitter Collabs, reports, newsletters, podcasts, etc.
                    </p>
                  </div>
                </div>
                
                {/* Step 2 */}
                <div className="flex items-start border border-muted-foreground/10 rounded-lg overflow-hidden">
                  <div className="bg-primary/65 flex-shrink-0 w-14 h-full min-h-[4rem] flex items-center justify-center relative">
                    <span className="font-bold text-xl text-primary-foreground">2</span>
                    <div className="absolute right-0 w-3 h-3 bg-primary/65 rotate-45 translate-x-1/2"></div>
                  </div>
                  <div className="p-3 text-left w-full" style={{ maxWidth: "calc(100% - 3.5rem)" }}>
                    <h4 className="font-medium text-sm">Approve or Pass Collab Requests</h4>
                    <p className="text-xs text-muted-foreground">
                      You'll be notified when others request to join your collab.
                    </p>
                  </div>
                </div>
                
                {/* Step 3 */}
                <div className="flex items-start border border-muted-foreground/10 rounded-lg overflow-hidden">
                  <div className="bg-primary/65 flex-shrink-0 w-14 h-full min-h-[4rem] flex items-center justify-center relative">
                    <span className="font-bold text-xl text-primary-foreground">3</span>
                    <div className="absolute right-0 w-3 h-3 bg-primary/65 rotate-45 translate-x-1/2"></div>
                  </div>
                  <div className="p-3 text-left w-full" style={{ maxWidth: "calc(100% - 3.5rem)" }}>
                    <h4 className="font-medium text-sm">Chat with Your New Match</h4>
                    <p className="text-xs text-muted-foreground">
                      You'll be able to chat directly in Telegram with your new collaborator.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom CTA Button */}
            <Button 
              onClick={handleNavigateToCreateCollab}
              className="w-full max-w-xs py-3 mx-auto mb-6 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Create Your First Collab
            </Button>
            
            {/* Privacy Section */}
            <div className="flex flex-col items-center">
              <div className="flex items-stretch border border-muted-foreground/10 rounded-lg overflow-hidden">
                <div className="bg-yellow-500/65 flex-shrink-0 w-14 flex items-center justify-center">
                  <span className="text-white"><Lock size={18} /></span>
                </div>
                <div className="p-3 text-left w-full" style={{ maxWidth: "calc(100% - 3.5rem)" }}>
                  <p className="text-xs flex flex-col gap-1">
                    <strong>PRIVACY FIRST</strong>
                    <span className="text-muted-foreground">Contact details shared only upon successful match. Anyone you passed on won't be notified.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
            )}
          </div>
          
          {/* Application Details Dialog */}
          <Dialog open={applicationDialogOpen} onOpenChange={setApplicationDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Application Details</DialogTitle>
                <DialogDescription>
                  Review the application information
                </DialogDescription>
              </DialogHeader>
              
              {renderApplicationDetails()}
              
              <DialogFooter>
                <Button 
                  variant="outline" 
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
          
          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!collabToDelete} onOpenChange={(open) => !open && setCollabToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Collaboration</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this collaboration 
                  and remove its data from our servers.
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
      </div>
    </MobileCheck>
  );
}