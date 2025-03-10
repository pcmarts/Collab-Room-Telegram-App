import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Users, 
  CalendarDays, 
  Clock, 
  Coins, 
  Sliders, 
  Check, 
  X, 
  Eye, 
  MessageSquare, 
  UserCheck, 
  UserX, 
  ListChecks, 
  Trash2,
  Filter,
  Info,
  Save,
  Plus
} from "lucide-react";
import { 
  COLLAB_TYPES, 
  TWITTER_COLLAB_TYPES,
  TWITTER_FOLLOWER_COUNTS,
  COLLAB_TOPICS,
  COMPANY_TAG_CATEGORIES,
  AUDIENCE_SIZE_RANGES,
  FUNDING_STAGES, 
  type Collaboration,
  type CollabApplication,
  type ApplicationData,
  type MarketingPreferences,
  type NotificationPreferences
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
import { Separator } from "@/components/ui/separator";

// Marketing Collab Schema - keeping the same structure for compatibility
const marketingCollabSchema = z.object({
  // Opt-in settings for discovery and hosting
  enabledCollabs: z.array(z.string()).default([]),
  enabledTwitterCollabs: z.array(z.string()).default([]),
  
  // Filter settings
  matchingEnabled: z.boolean().default(false),
  companySectors: z.array(z.string()).default([]),
  topics: z.array(z.string()).default([]),
  companyFollowers: z.enum(TWITTER_FOLLOWER_COUNTS).optional(),
  userFollowers: z.enum(TWITTER_FOLLOWER_COUNTS).optional(),
  fundingStages: z.array(z.string()).default([]),
  hasToken: z.boolean().default(false)
});

type MarketingCollabFormData = z.infer<typeof marketingCollabSchema>;

export default function MarketingCollabs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const formRef = useRef<HTMLFormElement>(null);
  
  // Core state management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("preferences");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [collabsToHost, setCollabsToHost] = useState<string[]>([]);
  const [filtersEnabled, setFiltersEnabled] = useState({
    topics: false,
    companySectors: false, 
    companyFollowers: false,
    userFollowers: false,
    fundingStages: false,
    hasToken: false
  });
  
  // Collaborations and applications management
  const [activeCollabs, setActiveCollabs] = useState<Record<string, boolean>>({});
  const [selectedApplication, setSelectedApplication] = useState<CollabApplication | null>(null);
  const [collabToDelete, setCollabToDelete] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [processingApplicationId, setProcessingApplicationId] = useState<string | null>(null);

  // Form initialization
  const form = useForm<MarketingCollabFormData>({
    resolver: zodResolver(marketingCollabSchema),
    defaultValues: {
      enabledCollabs: [],
      enabledTwitterCollabs: [],
      matchingEnabled: false,
      companySectors: [],
      topics: [],
      fundingStages: [],
      hasToken: false
    }
  });

  // Data fetching with type safety
  const { data: profileData, isLoading: isProfileLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile'],
    refetchOnWindowFocus: false,
  });
  
  const { data: collaborations = [], isLoading: isCollabsLoading } = useQuery<Collaboration[]>({
    queryKey: ['/api/collaborations/my'],
    refetchOnWindowFocus: false,
  });

  const { data: applications = [], isLoading: isAppsLoading } = useQuery<CollabApplication[]>({
    queryKey: ['/api/my-applications'],
    refetchOnWindowFocus: false,
  });

  // Initialize active state for existing collaborations
  useEffect(() => {
    if (collaborations.length > 0) {
      const initialActiveState: Record<string, boolean> = {};
      collaborations.forEach((collab: Collaboration) => {
        initialActiveState[collab.id] = collab.status === 'active';
      });
      setActiveCollabs(initialActiveState);
    }
  }, [collaborations]);

  // Handle creating/deleting collaborations
  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      setActiveCollabs((prev) => ({
        ...prev,
        [id]: isActive
      }));
      
      const response = await apiRequest(
        `/api/collaborations/${id}/status`, 
        'PATCH',
        { status: isActive ? 'active' : 'inactive' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to update collaboration status');
      }
      
      // Refresh collaborations after update
      queryClient.invalidateQueries({ queryKey: ['/api/collaborations/my'] });
      
    } catch (error) {
      // Revert the UI state if API call fails
      setActiveCollabs((prev) => ({
        ...prev,
        [id]: !isActive
      }));
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCollaboration = async () => {
    if (!collabToDelete) return;
    
    try {
      const response = await apiRequest(
        `/api/collaborations/${collabToDelete}`, 
        'DELETE'
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete collaboration');
      }
      
      // Remove the deleted collaboration from UI
      queryClient.invalidateQueries({ queryKey: ['/api/collaborations/my'] });
      
      toast({
        title: "Collaboration deleted",
        description: "The collaboration has been successfully removed",
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete collaboration",
        variant: "destructive",
      });
    } finally {
      setCollabToDelete(null);
    }
  };

  // Handle application approvals/rejections
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
        });
        
        // Refresh applications after update
        queryClient.invalidateQueries({ queryKey: ['/api/my-applications'] });
        setSelectedApplication(null);
      } else {
        throw new Error('Failed to approve application');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve application",
        variant: "destructive",
      });
    } finally {
      setProcessingApplicationId(null);
      setFeedbackMessage('');
    }
  };

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
        });
        
        // Refresh applications after update
        queryClient.invalidateQueries({ queryKey: ['/api/my-applications'] });
        setSelectedApplication(null);
      } else {
        throw new Error('Failed to reject application');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject application",
        variant: "destructive",
      });
    } finally {
      setProcessingApplicationId(null);
      setFeedbackMessage('');
    }
  };

  const viewApplicationDetails = (application: CollabApplication) => {
    setSelectedApplication(application);
  };

  // Toggle form field visibility
  const toggleFilter = (filterName: keyof typeof filtersEnabled) => {
    setFiltersEnabled((prev) => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
  };

  // Handle topic checkbox state management
  const handleTopicChange = (topic: string, checked: boolean) => {
    console.log(`Topic change: ${topic} - ${checked ? 'Checked' : 'Unchecked'}`);
    
    if (checked) {
      // Add topic to the selected topics
      setSelectedTopics(prev => {
        const newTopics = [...prev, topic];
        console.log(`Selected topics after adding ${topic}:`, newTopics);
        return newTopics;
      });
      
      // Also update the form state to keep it in sync
      const currentTopics = form.getValues().topics || [];
      if (!currentTopics.includes(topic)) {
        const newFormTopics = [...currentTopics, topic];
        console.log(`Form topics after adding ${topic}:`, newFormTopics);
        form.setValue('topics', newFormTopics);
      }
    } else {
      // Remove topic from selected topics
      setSelectedTopics(prev => {
        const newTopics = prev.filter(t => t !== topic);
        console.log(`Selected topics after removing ${topic}:`, newTopics);
        return newTopics;
      });
      
      // Also update the form state to keep it in sync
      const currentTopics = form.getValues().topics || [];
      const newFormTopics = currentTopics.filter(t => t !== topic);
      console.log(`Form topics after removing ${topic}:`, newFormTopics);
      form.setValue('topics', newFormTopics);
    }
  };

  // Load existing preferences when profile data is fetched
  useEffect(() => {
    if (profileData) {
      const marketingPreferences = profileData.marketingPreferences || {};
      console.log("Loading marketing preferences:", marketingPreferences);
      
      // Extract data from marketing preferences
      const marketingPrefs = marketingPreferences;
      const savedCollabsToHost = marketingPrefs.collabs_to_host || [];
      const collabsToDiscover = marketingPrefs.collabs_to_discover || [];
      const savedTwitterCollabs = marketingPrefs.twitter_collabs || [];
      
      // Load filter toggle states from dedicated fields
      setFiltersEnabled({
        topics: !!marketingPrefs.discovery_filter_topics_enabled,
        companySectors: !!marketingPrefs.discovery_filter_company_sectors_enabled,
        companyFollowers: !!marketingPrefs.discovery_filter_company_followers_enabled,
        userFollowers: !!marketingPrefs.discovery_filter_user_followers_enabled,
        fundingStages: !!marketingPrefs.discovery_filter_funding_stages_enabled,
        hasToken: !!marketingPrefs.discovery_filter_token_status_enabled
      });
      
      setCollabsToHost(savedCollabsToHost);

      // Extract topics from filtered_marketing_topics
      const topicEntries = (marketingPrefs.filtered_marketing_topics || [])
        .filter((item: string) => item.startsWith('filter:topic:'))
        .map((item: string) => item.replace('filter:topic:', ''));
      
      console.log("Extracted topics from saved preferences:", topicEntries);
      setSelectedTopics(topicEntries);
      
      // Extract other filter values
      let filterCompanySectors: string[] = [];
      let filterFundingStages: string[] = [];
      let filterCompanyFollowers: string = TWITTER_FOLLOWER_COUNTS[0];
      let filterUserFollowers: string = TWITTER_FOLLOWER_COUNTS[0];
      let filterHasToken: boolean = false;
      let filterMatchingEnabled: boolean = !!marketingPrefs.discovery_filter_enabled;
      
      // Process saved filter data from filtered_marketing_topics
      (marketingPrefs.filtered_marketing_topics || []).forEach((item: string) => {
        if (typeof item === 'string') {
          if (item.startsWith('filter:sector:')) {
            filterCompanySectors.push(item.replace('filter:sector:', ''));
          } else if (item.startsWith('filter:stage:')) {
            filterFundingStages.push(item.replace('filter:stage:', ''));
          } else if (item.startsWith('filter:company_followers:')) {
            filterCompanyFollowers = item.replace('filter:company_followers:', '');
          } else if (item.startsWith('filter:user_followers:')) {
            filterUserFollowers = item.replace('filter:user_followers:', '');
          } else if (item === 'filter:has_token:true') {
            filterHasToken = true;
          } else if (item === 'filter:matching_enabled:true') {
            filterMatchingEnabled = true;
          }
        }
      });
      
      // Reset form with loaded values
      form.reset({
        enabledCollabs: collabsToDiscover,
        enabledTwitterCollabs: savedTwitterCollabs,
        matchingEnabled: filterMatchingEnabled,
        companySectors: filterCompanySectors,
        topics: topicEntries,
        fundingStages: filterFundingStages,
        hasToken: filterHasToken,
        companyFollowers: filterCompanyFollowers as typeof TWITTER_FOLLOWER_COUNTS[number],
        userFollowers: filterUserFollowers as typeof TWITTER_FOLLOWER_COUNTS[number]
      });
    }
  }, [profileData, form]);

  // Submit handler for the form
  const onSubmit = async (data: MarketingCollabFormData) => {
    try {
      setIsSubmitting(true);
      console.log("Form submitted:", data);
      
      // Collect checked topics from form and component state
      // This is more reliable than querying the DOM directly
      const topicsToSave = selectedTopics;
      console.log("Selected topics to save:", topicsToSave);
      
      // Format topics for storage
      const formattedTopics = topicsToSave.map(topic => `filter:topic:${topic}`);
      
      // Format other filter data
      const formattedSectors = data.companySectors.map(sector => `filter:sector:${sector}`);
      const formattedStages = data.fundingStages.map(stage => `filter:stage:${stage}`);
      
      // Create metadata for filter toggles
      const filterMetadata = [
        ...(data.matchingEnabled ? [`filter:matching_enabled:true`] : []),
        ...(data.companyFollowers ? [`filter:company_followers:${data.companyFollowers}`] : []),
        ...(data.userFollowers ? [`filter:user_followers:${data.userFollowers}`] : []),
        ...(data.hasToken ? [`filter:has_token:true`] : []),
        // Save the toggle state for each filter section
        ...(filtersEnabled.topics ? [`filter:section_enabled:topics`] : []),
        ...(filtersEnabled.companySectors ? [`filter:section_enabled:companySectors`] : []),
        ...(filtersEnabled.companyFollowers ? [`filter:section_enabled:companyFollowers`] : []),
        ...(filtersEnabled.userFollowers ? [`filter:section_enabled:userFollowers`] : []),
        ...(filtersEnabled.fundingStages ? [`filter:section_enabled:fundingStages`] : []),
        ...(filtersEnabled.hasToken ? [`filter:section_enabled:hasToken`] : [])
      ];
      
      // Combine all filter data
      const allFilterData = [
        ...formattedTopics,
        ...formattedSectors,
        ...formattedStages,
        ...filterMetadata
      ];
      
      // Filter out any existing filter entries from saved data
      const marketingPreferences = profileData?.marketingPreferences || {} as MarketingPreferences;
      const existingTags = marketingPreferences.filtered_marketing_topics || [];
      const nonFilterTags = existingTags.filter((tag: string) => 
        typeof tag === 'string' && !tag.startsWith('filter:')
      );
      
      // For notification frequency
      const notificationPreferences = profileData?.notificationPreferences || {} as NotificationPreferences;
      const notification_frequency = notificationPreferences.notification_frequency || "Daily";
      
      // General preferences data
      const generalPrefsData = {
        notification_frequency
      };
      
      // Marketing preferences data
      const marketingPrefsData = {
        collabs_to_discover: data.enabledCollabs,
        collabs_to_host: collabsToHost,
        twitter_collabs: data.enabledTwitterCollabs,
        filtered_marketing_topics: [...nonFilterTags, ...allFilterData],
        discovery_filter_enabled: data.matchingEnabled,
        discovery_filter_topics_enabled: filtersEnabled.topics,
        discovery_filter_company_sectors_enabled: filtersEnabled.companySectors,
        discovery_filter_company_followers_enabled: filtersEnabled.companyFollowers,
        discovery_filter_user_followers_enabled: filtersEnabled.userFollowers,
        discovery_filter_funding_stages_enabled: filtersEnabled.fundingStages,
        discovery_filter_token_status_enabled: filtersEnabled.hasToken
      };
      
      console.log("Marketing preferences data being sent:", marketingPrefsData);
      
      // Save marketing preferences
      const marketingResponse = await apiRequest('/api/marketing-preferences', 'POST', marketingPrefsData);
      
      if (!marketingResponse.ok) {
        throw new Error('Failed to update marketing preferences');
      }
      
      // Save general preferences
      const response = await apiRequest('/api/preferences', 'POST', generalPrefsData);
      
      if (!response.ok) {
        throw new Error('Failed to update general preferences');
      }
      
      // Refresh profile data
      await queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      
      toast({
        title: "Success!",
        description: "Your marketing collaboration preferences have been updated",
        duration: 3000
      });
      
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update preferences"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render a collaboration card
  const renderCollaborationCard = (collab: Collaboration) => {
    // Get pending applications
    const pendingApplications = applications?.filter(app => 
      app.collaboration_id === collab.id && app.status === 'pending'
    ) || [];
    const hasApplications = pendingApplications.length > 0;
    
    // Get active state
    const isActive = activeCollabs[collab.id] !== undefined 
      ? activeCollabs[collab.id] 
      : collab.status === 'active';
    
    return (
      <Card key={collab.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <Badge className="mb-2">{collab.collab_type}</Badge>
              <CardTitle className="text-xl">
                {collab.title === "Collaboration" ? collab.collab_type : collab.title}
              </CardTitle>
            </div>
            {hasApplications && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {pendingApplications.length} application{pendingApplications.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {collab.description.includes("Created using Collab Room") 
              ? collab.description.replace("Created using Collab Room.", "").trim() 
              : collab.description}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <CalendarDays className="h-3 w-3" />
              <span>{collab.date_type === 'flexible' ? 'Flexible timing' : 'Specific date'}</span>
            </div>
            
            {collab.is_free_collab === false && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Coins className="h-3 w-3" />
                <span>Paid opportunity</span>
              </div>
            )}
            
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Created on {collab.created_at ? new Date(collab.created_at).toLocaleDateString() : 'recent'}</span>
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
            <Button 
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setLocation(`/collaboration/edit/${collab.id}`)}
            >
              Edit
            </Button>
            
            {hasApplications ? (
              <Button 
                variant="default"
                size="sm"
                className="flex-1"
                onClick={() => setLocation(`/collaboration/${collab.id}/applications`)}
              >
                <ListChecks className="h-4 w-4 mr-1" /> 
                View Applications
              </Button>
            ) : (
              <Button 
                variant="outline" 
                type="button"
                size="sm"
                className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => setCollabToDelete(collab.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  };

  // Render an application card
  const renderApplicationCard = (application: CollabApplication) => {
    // Get status badge
    const getStatusBadge = () => {
      switch (application.status) {
        case 'approved':
          return (
            <Badge variant="default" className="flex items-center gap-1 bg-green-500">
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
                Applied on {application.created_at ? new Date(application.created_at).toLocaleDateString() : 'recent date'}
              </p>
              <CardTitle className="text-xl">
                Collaboration Application
              </CardTitle>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          {application.message && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-1">Message with application:</p>
              <p className="text-sm text-gray-600 line-clamp-3">{application.message}</p>
            </div>
          )}
          
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>Status: {application.status}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline"
            className="w-full"
            onClick={() => viewApplicationDetails(application)}
          >
            <Eye className="h-4 w-4 mr-2" /> View Details
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // Loading skeletons
  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, index) => (
      <Card key={index} className="mb-4">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-20 mb-2" />
          <Skeleton className="h-7 w-3/4" />
        </CardHeader>
        <CardContent className="pb-2">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-4" />
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-36" />
          </div>
          
          <div className="flex items-center justify-between border-t pt-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex gap-2 w-full">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </div>
        </CardFooter>
      </Card>
    ));
  };

  // Application details dialog content
  const renderApplicationDetails = () => {
    if (!selectedApplication) return null;
    
    return (
      <div className="py-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <p className="font-medium">Application ID:</p>
            <p className="text-sm">{selectedApplication.id}</p>
          </div>
          
          <Separator />
          
          <div>
            <p className="font-medium">Collaboration ID:</p>
            <p className="text-sm">{selectedApplication.collaboration_id}</p>
          </div>
          
          <div>
            <p className="font-medium">Status:</p>
            <div className="mt-1">
              {selectedApplication.status === 'pending' ? (
                <Badge variant="outline" className="flex items-center w-fit gap-1">
                  <Clock className="h-3 w-3" /> Pending Review
                </Badge>
              ) : selectedApplication.status === 'approved' ? (
                <Badge variant="default" className="flex items-center w-fit gap-1 bg-green-500">
                  <Check className="h-3 w-3" /> Approved
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center w-fit gap-1">
                  <X className="h-3 w-3" /> Rejected
                </Badge>
              )}
            </div>
          </div>
          
          <Separator />
          
          {selectedApplication.message && (
            <div>
              <p className="font-medium">Message:</p>
              <p className="text-sm mt-1">{selectedApplication.message}</p>
            </div>
          )}
          
          {selectedApplication.status === 'pending' && (
            <div className="mt-4 space-y-4">
              <Separator />
              
              <div>
                <p className="font-medium">Feedback to Applicant:</p>
                <Textarea 
                  placeholder="Add a message to the applicant (optional)..."
                  className="mt-2"
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => handleRejectApplication(selectedApplication.id)}
                  disabled={processingApplicationId === selectedApplication.id}
                >
                  {processingApplicationId === selectedApplication.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UserX className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => handleApproveApplication(selectedApplication.id)}
                  disabled={processingApplicationId === selectedApplication.id}
                >
                  {processingApplicationId === selectedApplication.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UserCheck className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100svh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-background">
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!collabToDelete} onOpenChange={(open) => !open && setCollabToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collaboration</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this collaboration
              and any pending applications for it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCollaboration} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Application Details Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={(open) => !open && setSelectedApplication(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review the details of this application to your collaboration.
            </DialogDescription>
          </DialogHeader>
          {renderApplicationDetails()}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <PageHeader
        title="Marketing Collaborations"
        subtitle="Manage your marketing collaborations and preferences"
        backUrl="/dashboard"
      />
      
      <div className="container max-w-5xl px-4 py-6">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="collaborations">My Collaborations</TabsTrigger>
          </TabsList>
          
          {/* Preferences Tab */}
          <TabsContent value="preferences" className="mt-6">
            <Form {...form}>
              <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Collaboration Discovery</CardTitle>
                    <CardDescription>
                      Select the types of collaborations you're interested in discovering
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="enabledCollabs"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel className="text-base">Types of collaborations to discover</FormLabel>
                            <FormDescription>
                              Select which types of collaborations you'd like to find
                            </FormDescription>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {COLLAB_TYPES.map((collabType) => (
                              <FormField
                                key={collabType}
                                control={form.control}
                                name="enabledCollabs"
                                render={({ field }) => (
                                  <FormItem
                                    key={collabType}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(collabType)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, collabType])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== collabType
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {collabType}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <Separator />
                    
                    <FormField
                      control={form.control}
                      name="enabledTwitterCollabs"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel className="text-base">Twitter collaborations</FormLabel>
                            <FormDescription>
                              Select which Twitter collaboration types you're interested in
                            </FormDescription>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {TWITTER_COLLAB_TYPES.map((collabType) => (
                              <FormField
                                key={collabType}
                                control={form.control}
                                name="enabledTwitterCollabs"
                                render={({ field }) => (
                                  <FormItem
                                    key={collabType}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(collabType)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, collabType])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== collabType
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {collabType}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                
                {/* Matching Filters */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Collaboration Matching Filters</CardTitle>
                        <CardDescription>
                          Set up your matching criteria for discovering relevant collaborations
                        </CardDescription>
                      </div>
                      <FormField
                        control={form.control}
                        name="matchingEnabled"
                        render={({ field }) => (
                          <FormItem className="space-y-0 flex items-center">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <Label className="ml-2">
                              {field.value ? "Enabled" : "Disabled"}
                            </Label>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Topic Filter */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-base font-medium">Filter by Topics</h3>
                          <p className="text-sm text-gray-500">
                            Only show collaborations in these topics
                          </p>
                        </div>
                        <Switch 
                          checked={filtersEnabled.topics}
                          onCheckedChange={() => toggleFilter('topics')}
                        />
                      </div>
                      
                      {filtersEnabled.topics && (
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {COLLAB_TOPICS.map((topic) => (
                              <div key={topic} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`topic-${topic}`}
                                  checked={selectedTopics.includes(topic)}
                                  onCheckedChange={(checked) => handleTopicChange(topic, !!checked)}
                                  data-topic-checkbox 
                                  data-topic-value={topic}
                                />
                                <label
                                  htmlFor={`topic-${topic}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {topic}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Company Sectors Filter */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-base font-medium">Filter by Company Sectors</h3>
                          <p className="text-sm text-gray-500">
                            Only show collaborations from companies in these sectors
                          </p>
                        </div>
                        <Switch 
                          checked={filtersEnabled.companySectors}
                          onCheckedChange={() => toggleFilter('companySectors')}
                        />
                      </div>
                      
                      {filtersEnabled.companySectors && (
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <FormField
                            control={form.control}
                            name="companySectors"
                            render={({ field }) => (
                              <FormItem>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {Object.entries(COMPANY_TAG_CATEGORIES).map(([category, tags]) => (
                                    <div key={category} className="col-span-full mb-4">
                                      <h4 className="font-medium mb-2">{category}</h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {tags.map((tag) => (
                                          <FormItem
                                            key={tag}
                                            className="flex flex-row items-start space-x-3 space-y-0"
                                          >
                                            <FormControl>
                                              <Checkbox
                                                checked={field.value.includes(tag)}
                                                onCheckedChange={(checked) => {
                                                  return checked
                                                    ? field.onChange([...field.value, tag])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                          (value) => value !== tag
                                                        )
                                                      )
                                                }}
                                              />
                                            </FormControl>
                                            <FormLabel className="text-sm font-normal">
                                              {tag}
                                            </FormLabel>
                                          </FormItem>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Company Followers Filter */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-base font-medium">Filter by Company Twitter Followers</h3>
                          <p className="text-sm text-gray-500">
                            Only show collaborations from companies with at least this many followers
                          </p>
                        </div>
                        <Switch 
                          checked={filtersEnabled.companyFollowers}
                          onCheckedChange={() => toggleFilter('companyFollowers')}
                        />
                      </div>
                      
                      {filtersEnabled.companyFollowers && (
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <FormField
                            control={form.control}
                            name="companyFollowers"
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select minimum followers" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {TWITTER_FOLLOWER_COUNTS.map((count) => (
                                      <SelectItem key={count} value={count}>
                                        {count}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* User Followers Filter */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-base font-medium">Filter by User Twitter Followers</h3>
                          <p className="text-sm text-gray-500">
                            Only show collaborations from users with at least this many followers
                          </p>
                        </div>
                        <Switch 
                          checked={filtersEnabled.userFollowers}
                          onCheckedChange={() => toggleFilter('userFollowers')}
                        />
                      </div>
                      
                      {filtersEnabled.userFollowers && (
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <FormField
                            control={form.control}
                            name="userFollowers"
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select minimum followers" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {TWITTER_FOLLOWER_COUNTS.map((count) => (
                                      <SelectItem key={count} value={count}>
                                        {count}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Funding Stages Filter */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-base font-medium">Filter by Funding Stages</h3>
                          <p className="text-sm text-gray-500">
                            Only show collaborations from companies in these funding stages
                          </p>
                        </div>
                        <Switch 
                          checked={filtersEnabled.fundingStages}
                          onCheckedChange={() => toggleFilter('fundingStages')}
                        />
                      </div>
                      
                      {filtersEnabled.fundingStages && (
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <FormField
                            control={form.control}
                            name="fundingStages"
                            render={({ field }) => (
                              <FormItem>
                                <div className="grid grid-cols-2 gap-3">
                                  {FUNDING_STAGES.map((stage) => (
                                    <FormItem
                                      key={stage}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value.includes(stage)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, stage])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== stage
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {stage}
                                      </FormLabel>
                                    </FormItem>
                                  ))}
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Has Token Filter */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-base font-medium">Filter by Token Status</h3>
                          <p className="text-sm text-gray-500">
                            Only show collaborations from companies with a token
                          </p>
                        </div>
                        <Switch 
                          checked={filtersEnabled.hasToken}
                          onCheckedChange={() => toggleFilter('hasToken')}
                        />
                      </div>
                      
                      {filtersEnabled.hasToken && (
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <FormField
                            control={form.control}
                            name="hasToken"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Only show companies with a token
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          {/* Collaborations Tab */}
          <TabsContent value="collaborations" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">My Collaborations</h2>
              <Button onClick={() => setLocation('/create-collaboration')}>
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </Button>
            </div>
            
            {isCollabsLoading ? (
              renderSkeletons()
            ) : collaborations.length > 0 ? (
              <div className="space-y-4">
                {collaborations.map((collab: Collaboration) => renderCollaborationCard(collab))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Info className="h-8 w-8 text-gray-400" />
                  <h3 className="text-lg font-medium">No collaborations yet</h3>
                  <p className="text-gray-500 mb-4">
                    You haven't created any collaborations yet. Create your first one to start connecting!
                  </p>
                  <Button onClick={() => setLocation('/create-collaboration')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Collaboration
                  </Button>
                </div>
              </Card>
            )}
            
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-6">My Applications</h2>
              
              {isAppsLoading ? (
                renderSkeletons()
              ) : applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((app: CollabApplication) => renderApplicationCard(app))}
                </div>
              ) : (
                <Card className="p-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Info className="h-8 w-8 text-gray-400" />
                    <h3 className="text-lg font-medium">No applications yet</h3>
                    <p className="text-gray-500 mb-4">
                      You haven't applied to any collaborations yet. Browse available collaborations to find opportunities!
                    </p>
                    <Button onClick={() => setLocation('/browse-collaborations')}>
                      <Filter className="h-4 w-4 mr-2" />
                      Browse Collaborations
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}