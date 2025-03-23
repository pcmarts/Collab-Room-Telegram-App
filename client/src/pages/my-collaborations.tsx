import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
import { PageHeader } from "@/components/layout/PageHeader";
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
  PenTool
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
  
  // Fetch user's collaborations
  const { data: collaborations, isLoading: isLoadingCollabs } = useQuery({
    queryKey: ['/api/collaborations/my'],
    queryFn: async () => {
      try {
        console.log("Fetching collaborations...");
        // Use the standardized apiRequest function to ensure Telegram headers are included
        const data = await apiRequest('/api/collaborations/my');
        console.log("Collaborations API response data:", data);
        
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
    }
  });
  
  // Fetch user's applications
  const { data: applications, isLoading: isLoadingApps } = useQuery({
    queryKey: ['/api/my-applications'],
    queryFn: async () => {
      try {
        console.log("Fetching applications...");
        // Use the standardized apiRequest function to ensure Telegram headers are included
        const data = await apiRequest('/api/my-applications');
        console.log("Applications API response data:", data);
        return data as CollabApplication[];
      } catch (error) {
        console.error("Error fetching applications:", error);
        throw error;
      }
    }
  });
  
  // Fetch potential matches (users who swiped right on host's collaborations)
  const { data: potentialMatches, isLoading: isLoadingMatches } = useQuery({
    queryKey: ['/api/potential-matches'],
    queryFn: async () => {
      try {
        console.log("Fetching potential matches...");
        // Use the standardized apiRequest function to ensure Telegram headers are included
        const data = await apiRequest('/api/potential-matches');
        console.log("Potential matches API response data:", data);
        return data as PotentialMatch[];
      } catch (error) {
        console.error("Error fetching potential matches:", error);
        return [] as PotentialMatch[]; // Return empty array on error to avoid breaking the UI
      }
    }
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
      const response = await apiRequest(`/api/collaborations/${id}/status`, 'PATCH', { status });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update collaboration status');
      }
      return await response.json();
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
      const response = await apiRequest(`/api/collaborations/${collabToDelete}`, 'DELETE');
      
      if (response.ok) {
        toast({
          title: "Collaboration Deleted",
          description: "Your collaboration has been deleted successfully",
          duration: 2000, // Auto-dismiss after 2 seconds
        });
        
        // Refresh the collaborations data
        queryClient.invalidateQueries({ queryKey: ['/api/collaborations/my'] });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete collaboration');
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
      <Card key={collab.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <Badge className="mb-2 flex items-center gap-1">
                {getCollabTypeIcon(collab.collab_type)}
                {collab.collab_type}
              </Badge>
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
    // Parse the application data
    let applicationData: ApplicationData = {} as ApplicationData;
    try {
      applicationData = application.application_data as unknown as ApplicationData;
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
    
    // Parse the application data
    let applicationData: ApplicationData = {} as ApplicationData;
    try {
      applicationData = selectedApplication.application_data as unknown as ApplicationData;
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
  
  return (
    <MobileCheck>
      <div className="min-h-[100svh] bg-background">
        <div className="flex justify-between items-center p-6">
          <h1 className="text-2xl font-bold">My Collabs</h1>
          <GlowButton 
            onClick={() => setLocation('/create-collaboration-steps')}
          >
            Create New
          </GlowButton>
        </div>
        
        <div className="container mx-auto py-4 px-4">
          
          {isLoadingCollabs ? (
            renderSkeletons()
          ) : collaborations && collaborations.length > 0 ? (
            <div>
              {collaborations.map(collab => renderCollaborationCard(collab))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-gray-500 mb-4">You haven't created any collabs yet</p>
              <p className="text-gray-400 text-sm mb-6">
                Create your first collaboration to connect with others
              </p>
              <Button 
                onClick={() => setLocation('/create-collaboration-steps')}
                variant="secondary"
              >
                Get Started
              </Button>
            </div>
          )}
          
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