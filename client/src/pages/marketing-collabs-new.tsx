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
  Plus,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { 
  COLLAB_TYPES, 
  TWITTER_COLLAB_TYPES,
  TWITTER_FOLLOWER_COUNTS,
  COLLAB_TOPICS,
  COMPANY_TAG_CATEGORIES,
  AUDIENCE_SIZE_RANGES,
  FUNDING_STAGES, 
  BLOCKCHAIN_NETWORKS,
  BLOCKCHAIN_NETWORK_CATEGORIES,
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

// Marketing Collab Schema with updated fields for direct DB mapping
const marketingCollabSchema = z.object({
  // Opt-in settings for discovery and hosting
  enabledCollabs: z.array(z.string()).default([]),
  enabledTwitterCollabs: z.array(z.string()).default([]),
  
  // Filter settings - these map to specific DB fields now
  matchingEnabled: z.boolean().default(false),
  companySectors: z.array(z.string()).default([]), // Will be mapped to company_tags
  topics: z.array(z.string()).default([]), // Will be stored in filtered_marketing_topics
  companyFollowers: z.enum(TWITTER_FOLLOWER_COUNTS).optional(), // Maps to company_twitter_followers
  userFollowers: z.enum(TWITTER_FOLLOWER_COUNTS).optional(), // Maps to twitter_followers
  fundingStages: z.array(z.string()).default([]), // Maps to funding_stage
  hasToken: z.boolean().default(false), // Maps to company_has_token
  blockchainNetworks: z.array(z.string()).default([]), // Maps to company_blockchain_networks
  
  // New standardized fields for consistent filtering
  company_twitter_followers: z.string().optional(),
  twitter_followers: z.string().optional(),
  funding_stage: z.string().optional(),
  company_has_token: z.boolean().default(false),
  company_token_ticker: z.string().optional(),
  company_blockchain_networks: z.array(z.string()).default([]),
  company_tags: z.array(z.string()).default([])
});

type MarketingCollabFormData = z.infer<typeof marketingCollabSchema>;

export default function MarketingCollabs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const formRef = useRef<HTMLFormElement>(null);
  
  // Core state management
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Check for the tab parameter in the URL to set initial active tab
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') === 'my' ? 'collaborations' : 'preferences';
  });
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [collabsToHost, setCollabsToHost] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [filtersEnabled, setFiltersEnabled] = useState({
    collabTypes: false,
    topics: false,
    companySectors: false, 
    companyFollowers: false,
    userFollowers: false,
    fundingStages: false,
    hasToken: false,
    blockchainNetworks: false
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
      // By default, enable all collab types (opt-out approach)
      enabledCollabs: [...COLLAB_TYPES],
      enabledTwitterCollabs: [], // We'll manage this differently now
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
        { status: isActive ? 'active' : 'paused' }
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
  
  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Handle topic checkbox state management
  const handleTopicChange = (topic: string, checked: boolean) => {
    console.log(`Topic change: ${topic} - ${checked ? 'Checked' : 'Unchecked'}`);
    
    if (checked) {
      // Add topic to the selected topics - ensure we have a clean array without duplicates
      setSelectedTopics(prev => {
        // First remove any existing instance to avoid duplicates
        const cleanPrev = prev.filter(t => t !== topic);
        const newTopics = [...cleanPrev, topic];
        console.log(`Selected topics after adding ${topic}:`, newTopics);
        return newTopics;
      });
      
      // Also update the form state to keep it in sync
      const currentTopics = form.getValues().topics || [];
      // First remove any existing instance to avoid duplicates
      const cleanCurrentTopics = currentTopics.filter(t => t !== topic);
      const newFormTopics = [...cleanCurrentTopics, topic];
      console.log(`Form topics after adding ${topic}:`, newFormTopics);
      form.setValue('topics', newFormTopics, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
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
      form.setValue('topics', newFormTopics, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
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
      
      // Split collabs_to_discover into regular collabs and twitter collabs
      const allCollabsToDiscover = marketingPrefs.collabs_to_discover || [];
      
      // Extract Twitter collaborations from collabs_to_discover
      const savedTwitterCollabs = allCollabsToDiscover
        .filter((item: string) => item.startsWith('twitter_collab:'))
        .map((item: string) => item.replace('twitter_collab:', ''));
        
      // Extract regular collaboration types (non-twitter) from collabs_to_discover
      const collabsToDiscover = allCollabsToDiscover
        .filter((item: string) => !item.startsWith('twitter_collab:'));
      
      // Load filter toggle states from dedicated fields
      setFiltersEnabled({
        collabTypes: !!marketingPrefs.discovery_filter_collab_types_enabled,
        topics: !!marketingPrefs.discovery_filter_topics_enabled,
        companySectors: !!marketingPrefs.discovery_filter_company_sectors_enabled,
        companyFollowers: !!marketingPrefs.discovery_filter_company_followers_enabled,
        userFollowers: !!marketingPrefs.discovery_filter_user_followers_enabled,
        fundingStages: !!marketingPrefs.discovery_filter_funding_stages_enabled,
        hasToken: !!marketingPrefs.discovery_filter_token_status_enabled,
        blockchainNetworks: !!marketingPrefs.discovery_filter_blockchain_networks_enabled
      });
      
      setCollabsToHost(savedCollabsToHost);

      // Extract topics from filtered_marketing_topics
      const topicEntries = (marketingPrefs.filtered_marketing_topics || [])
        .filter((item: string) => item.startsWith('filter:topic:'))
        .map((item: string) => item.replace('filter:topic:', ''));
      
      console.log("Extracted topics from saved preferences:", topicEntries);
      setSelectedTopics(topicEntries);
      
      // Extract other filter values from their dedicated fields
      let filterCompanySectors: string[] = [];
      let filterFundingStages: string[] = [];
      let filterCompanyFollowers: string = TWITTER_FOLLOWER_COUNTS[0];
      let filterUserFollowers: string = TWITTER_FOLLOWER_COUNTS[0];
      let filterHasToken: boolean = false;
      let filterBlockchainNetworks: string[] = [];
      let filterMatchingEnabled: boolean = !!marketingPrefs.discovery_filter_enabled;
      
      // Read data from dedicated standardized fields as per your request
      if (marketingPrefs.company_tags && Array.isArray(marketingPrefs.company_tags)) {
        filterCompanySectors = marketingPrefs.company_tags;
      }
      
      if (marketingPrefs.funding_stage) {
        filterFundingStages = [marketingPrefs.funding_stage];
      }
      
      if (marketingPrefs.company_twitter_followers) {
        filterCompanyFollowers = marketingPrefs.company_twitter_followers;
      }
      
      if (marketingPrefs.twitter_followers) {
        filterUserFollowers = marketingPrefs.twitter_followers;
      }
      
      if (marketingPrefs.company_has_token !== null) {
        filterHasToken = !!marketingPrefs.company_has_token;
      }
      
      if (marketingPrefs.company_blockchain_networks && Array.isArray(marketingPrefs.company_blockchain_networks)) {
        filterBlockchainNetworks = marketingPrefs.company_blockchain_networks;
      }
      
      console.log("Loading blockchain networks from preferences:", filterBlockchainNetworks);
      
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
        userFollowers: filterUserFollowers as typeof TWITTER_FOLLOWER_COUNTS[number],
        blockchainNetworks: filterBlockchainNetworks,
        
        // Also set the direct DB field values for consistency
        company_tags: filterCompanySectors,
        funding_stage: filterFundingStages.length > 0 ? filterFundingStages[0] : undefined,
        company_twitter_followers: filterCompanyFollowers,
        twitter_followers: filterUserFollowers, 
        company_has_token: filterHasToken,
        company_blockchain_networks: filterBlockchainNetworks
      });
    }
  }, [profileData, form]);

  // Direct submit handler - no longer using the form's handleSubmit 
  const handleDirectSubmit = async () => {
    try {
      setIsSubmitting(true);
      console.log("handleDirectSubmit called");
      
      // Get current form values
      const currentFormValues = form.getValues();
      
      // Prepare topics array - these are already formatted with the proper naming pattern
      const formattedTopics = selectedTopics.map(topic => `filter:topic:${topic}`);
      console.log("Topics to save:", selectedTopics); 
      console.log("Formatted topics:", formattedTopics);
      
      // We no longer need to format and combine filter criteria for filtered_marketing_topics
      // All criteria are now stored in their dedicated fields
      console.log("Using dedicated fields for filter criteria instead of filtered_marketing_topics");
      
      // Build marketing preferences data with standardized fields - everything mapped to direct DB fields
      const marketingPrefsData = {
        // Store both regular collab types and twitter collabs in collabs_to_discover
        collabs_to_discover: [
          ...currentFormValues.enabledCollabs,
          // Add twitter collabs with their prefix to collabs_to_discover
          ...currentFormValues.enabledTwitterCollabs.map(collabType => `twitter_collab:${collabType}`)
        ],
        collabs_to_host: [...collabsToHost],
        
        // Only store topic filters in filtered_marketing_topics
        filtered_marketing_topics: [
          // Include topics if topics filter is enabled
          ...(filtersEnabled.topics 
            ? selectedTopics.map(topic => `filter:topic:${topic}`) 
            : [])
        ],
        
        // Discovery filter toggle states
        discovery_filter_enabled: currentFormValues.matchingEnabled,
        discovery_filter_topics_enabled: filtersEnabled.topics,
        discovery_filter_company_sectors_enabled: filtersEnabled.companySectors,
        discovery_filter_company_followers_enabled: filtersEnabled.companyFollowers,
        discovery_filter_user_followers_enabled: filtersEnabled.userFollowers,
        discovery_filter_funding_stages_enabled: filtersEnabled.fundingStages,
        discovery_filter_token_status_enabled: filtersEnabled.hasToken,
        discovery_filter_blockchain_networks_enabled: filtersEnabled.blockchainNetworks,
        
        // Direct field mappings for each filter criteria as you requested
        company_tags: filtersEnabled.companySectors ? currentFormValues.companySectors : null,
        company_twitter_followers: filtersEnabled.companyFollowers ? currentFormValues.companyFollowers : null,
        twitter_followers: filtersEnabled.userFollowers ? currentFormValues.userFollowers : null,
        funding_stage: filtersEnabled.fundingStages && currentFormValues.fundingStages.length > 0 ? 
          currentFormValues.fundingStages[0] : null,
        company_has_token: filtersEnabled.hasToken ? currentFormValues.hasToken : null,
        company_blockchain_networks: filtersEnabled.blockchainNetworks ? 
          currentFormValues.blockchainNetworks : null
      };
      
      // Ensure all arrays are properly defined
      Object.keys(marketingPrefsData).forEach(key => {
        if (Array.isArray(marketingPrefsData[key])) {
          console.log(`Array check - ${key}: length=${marketingPrefsData[key].length}`);
        }
      });
      
      // Make the API request directly
      console.log("Making direct API request to /api/marketing-preferences");
      console.log("Payload:", JSON.stringify(marketingPrefsData, null, 2));
      
      // Direct API call using fetch
      const response = await fetch('/api/marketing-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(window.Telegram?.WebApp?.initData ? {
            'x-telegram-init-data': window.Telegram.WebApp.initData
          } : {})
        },
        body: JSON.stringify(marketingPrefsData)
      });
      
      console.log("Response status:", response.status);
      
      // Handle response
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to save preferences: ${response.status} ${response.statusText}`);
      }
      
      // Get response data
      const data = await response.json();
      console.log("Success response:", data);
      
      // Update UI state
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      
      // Show success message
      toast({
        title: "Success!",
        description: "Your marketing preferences have been updated",
        duration: 3000
      });
      
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save preferences"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Original form submission handler (kept for backward compatibility)
  const onSubmit = async (data: MarketingCollabFormData) => {
    console.log("Form onSubmit triggered but using direct submit instead");
    // Redirect to the direct submit handler
    await handleDirectSubmit();
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
              <CardTitle className="text-xl">
                {collab.collab_type}
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
          {collab.details && typeof collab.details === 'object' && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
              {collab.details.short_description || collab.details.description || collab.details.goals || "No description available"}
            </p>
          )}
          
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
              onClick={() => setLocation(`/edit-collaboration/${collab.id}`)}
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
        title="Discovery Filters"
        backUrl="/discover"
      />
      
      <div className="container max-w-5xl px-4 py-6 pb-24">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
          
          {/* Preferences Tab */}
          <TabsContent value="preferences" className="mt-6 pb-24">
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
                            <FormLabel className="text-base"></FormLabel>
                            <FormDescription>
                              
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
                                    className="flex flex-row items-center space-x-3 space-y-0 p-2 border rounded-md hover:bg-accent/10 mb-2"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(collabType)}
                                        className="h-5 w-5"
                                        onCheckedChange={(checked) => {
                                          // Handle special case for Twitter collaborations
                                          if (collabType === "Co-Marketing on Twitter") {
                                            if (checked) {
                                              // When selecting Twitter collab, add it to enabled collabs
                                              field.onChange([...field.value, collabType]);
                                              // If there are no Twitter collab types selected, add defaults
                                              if (form.getValues().enabledTwitterCollabs.length === 0) {
                                                // Enable some default Twitter collaboration types
                                                form.setValue('enabledTwitterCollabs', 
                                                  [...TWITTER_COLLAB_TYPES.slice(0, 2)], 
                                                  { shouldDirty: true, shouldValidate: true }
                                                );
                                              }
                                            } else {
                                              // When deselecting Twitter collab, remove it from enabled collabs
                                              field.onChange(field.value?.filter(value => value !== collabType));
                                              // Clear all Twitter collaboration types
                                              form.setValue('enabledTwitterCollabs', [], 
                                                { shouldDirty: true, shouldValidate: true }
                                              );
                                            }
                                          } else {
                                            // Normal handling for other collaboration types
                                            return checked
                                              ? field.onChange([...field.value, collabType])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== collabType
                                                  )
                                                )
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal w-full cursor-pointer" onClick={() => {
                                      const newChecked = !field.value?.includes(collabType);
                                      // Handle special case for Twitter collaborations
                                      if (collabType === "Co-Marketing on Twitter") {
                                        if (newChecked) {
                                          // When selecting Twitter collab, add it to enabled collabs
                                          field.onChange([...field.value, collabType]);
                                          // If there are no Twitter collab types selected, add defaults
                                          if (form.getValues().enabledTwitterCollabs.length === 0) {
                                            // Enable some default Twitter collaboration types
                                            form.setValue('enabledTwitterCollabs', 
                                              [...TWITTER_COLLAB_TYPES.slice(0, 2)], 
                                              { shouldDirty: true, shouldValidate: true }
                                            );
                                          }
                                        } else {
                                          // When deselecting Twitter collab, remove it from enabled collabs
                                          field.onChange(field.value?.filter(value => value !== collabType));
                                          // Clear all Twitter collaboration types
                                          form.setValue('enabledTwitterCollabs', [], 
                                            { shouldDirty: true, shouldValidate: true }
                                          );
                                        }
                                      } else {
                                        // Normal handling for other collaboration types
                                        return newChecked
                                          ? field.onChange([...field.value, collabType])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== collabType
                                              )
                                            )
                                      }
                                    }}>
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
                    
                    {/* Show Twitter collaboration options only when "Co-Marketing on Twitter" is selected */}
                    {form.watch('enabledCollabs').includes("Co-Marketing on Twitter") && (
                      <FormField
                        control={form.control}
                        name="enabledTwitterCollabs"
                        render={() => (
                          <FormItem>
                            <div className="mb-4">
                              <FormLabel className="text-base">Twitter Co-Marketing Options</FormLabel>
                              <FormDescription>
                                Select which specific Twitter co-marketing types you're interested in
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
                                      className="flex flex-row items-center space-x-3 space-y-0 p-2 border rounded-md hover:bg-accent/10 mb-2"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(collabType)}
                                          className="h-5 w-5"
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
                                      <FormLabel className="font-normal w-full cursor-pointer" onClick={() => {
                                        const newChecked = !field.value?.includes(collabType);
                                        return newChecked
                                          ? field.onChange([...field.value, collabType])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== collabType
                                              )
                                            )
                                      }}>
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
                    )}
                  </CardContent>
                </Card>
                
                {/* Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle>Filter Options</CardTitle>
                    <CardDescription>
                      Set up your criteria for discovering relevant collaborations
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Filter by Collab Types */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-base font-medium">Filter by Collab Type</h3>
                          <p className="text-sm text-gray-500">
                            Choose which types of collaborations you want to see
                          </p>
                        </div>
                        <Switch 
                          checked={filtersEnabled.collabTypes || false}
                          onCheckedChange={() => toggleFilter('collabTypes')}
                        />
                      </div>
                    </div>
                    
                    {/* Topic Filter */}
                      <>
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
                            <div className="border rounded-lg p-4 bg-background">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {COLLAB_TOPICS.map((topic) => (
                              <div key={topic} className="flex items-center p-2 border rounded-md hover:bg-accent/10 mb-2">
                                <Checkbox
                                  id={`topic-${topic}`}
                                  checked={selectedTopics.includes(topic)}
                                  onCheckedChange={(checked) => handleTopicChange(topic, !!checked)}
                                  data-topic-checkbox 
                                  data-topic-value={topic}
                                  className="h-5 w-5 mr-3"
                                />
                                <label
                                  htmlFor={`topic-${topic}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 w-full cursor-pointer"
                                  onClick={() => handleTopicChange(topic, !selectedTopics.includes(topic))}
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
                        <div className="border rounded-lg p-4 bg-background">
                          <FormField
                            control={form.control}
                            name="companySectors"
                            render={({ field }) => (
                              <FormItem>
                                <div className="space-y-4">
                                  {/* Show selection count */}
                                  {field.value.length > 0 && (
                                    <div className="flex justify-between items-center">
                                      <Badge variant="secondary" className="text-xs">
                                        {field.value.length} {field.value.length === 1 ? 'sector' : 'sectors'} selected
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  {/* Categorized sector selection */}
                                  {Object.entries(COMPANY_TAG_CATEGORIES).map(([category, tags]) => (
                                    <div key={category} className="border rounded p-3">
                                      <div 
                                        className="flex justify-between items-center cursor-pointer mb-2"
                                        onClick={() => toggleCategory(category)}
                                      >
                                        <div className="font-medium">{category}</div>
                                        <div>
                                          {expandedCategories.includes(category) ? 
                                            <ChevronUp className="h-4 w-4" /> : 
                                            <ChevronDown className="h-4 w-4" />
                                          }
                                        </div>
                                      </div>
                                      
                                      {expandedCategories.includes(category) && (
                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                          {tags.map((tag) => (
                                            <Button
                                              key={tag}
                                              type="button"
                                              variant={field.value.includes(tag) ? "default" : "outline"}
                                              className="h-auto py-2 px-3 justify-start text-left font-normal whitespace-normal"
                                              onClick={() => {
                                                const newChecked = !field.value.includes(tag);
                                                return newChecked
                                                  ? field.onChange([...field.value, tag])
                                                  : field.onChange(
                                                      field.value.filter(
                                                        (value) => value !== tag
                                                      )
                                                    )
                                              }}
                                            >
                                              {tag}
                                            </Button>
                                          ))}
                                        </div>
                                      )}
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
                        <div className="border rounded-lg p-4 bg-background">
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
                    
                    {/* User Followers Filter - Removed as requested */}
                    
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
                        <div className="border rounded-lg p-4 bg-background">
                          <FormField
                            control={form.control}
                            name="fundingStages"
                            render={({ field }) => (
                              <FormItem>
                                <div className="space-y-4">
                                  {/* Show selection count */}
                                  {field.value.length > 0 && (
                                    <div className="flex justify-between items-center">
                                      <Badge variant="secondary" className="text-xs">
                                        {field.value.length} {field.value.length === 1 ? 'stage' : 'stages'} selected
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  <div className="grid grid-cols-2 gap-2">
                                    {FUNDING_STAGES.map((stage) => (
                                      <Button
                                        key={stage}
                                        type="button"
                                        variant={field.value.includes(stage) ? "default" : "outline"}
                                        className="h-auto py-2 px-3 justify-start text-left font-normal"
                                        onClick={() => {
                                          const newChecked = !field.value.includes(stage);
                                          return newChecked
                                            ? field.onChange([...field.value, stage])
                                            : field.onChange(
                                                field.value.filter(
                                                  (value) => value !== stage
                                                )
                                              )
                                        }}
                                      >
                                        {stage}
                                      </Button>
                                    ))}
                                  </div>
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
                          onCheckedChange={(checked) => {
                            toggleFilter('hasToken');
                            form.setValue('hasToken', checked);
                          }}
                        />
                      </div>
                      
                      {filtersEnabled.hasToken && (
                        <div className="border rounded-lg p-4 bg-background">
                          <p className="text-sm text-muted-foreground">
                            When enabled, your feed will only show collaborations from companies 
                            that have their own token
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Blockchain Networks Filter */}
                    <div className="mt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-base font-medium">Filter by Blockchain Networks</h3>
                          <p className="text-sm text-gray-500">
                            Only show collaborations from companies on these networks
                          </p>
                        </div>
                        <Switch 
                          checked={filtersEnabled.blockchainNetworks}
                          onCheckedChange={() => toggleFilter('blockchainNetworks')}
                        />
                      </div>
                      
                      {filtersEnabled.blockchainNetworks && (
                        <div className="border rounded-lg p-4 bg-background">
                          <FormField
                            control={form.control}
                            name="blockchainNetworks"
                            render={({ field }) => (
                              <FormItem>
                                <div className="space-y-4">
                                  {/* Show selection count */}
                                  {field.value.length > 0 && (
                                    <div className="flex justify-between items-center">
                                      <Badge variant="secondary" className="text-xs">
                                        {field.value.length} {field.value.length === 1 ? 'network' : 'networks'} selected
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  {/* Categorized network selection */}
                                  {Object.entries(BLOCKCHAIN_NETWORK_CATEGORIES).map(([category, networks]) => (
                                    <div key={category} className="border rounded p-3">
                                      <div 
                                        className="flex justify-between items-center cursor-pointer mb-2"
                                        onClick={() => toggleCategory(category)}
                                      >
                                        <div className="font-medium">{category}</div>
                                        <div>
                                          {expandedCategories.includes(category) ? 
                                            <ChevronUp className="h-4 w-4" /> : 
                                            <ChevronDown className="h-4 w-4" />
                                          }
                                        </div>
                                      </div>
                                      
                                      {expandedCategories.includes(category) && (
                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                          {networks.map((network) => (
                                            <FormItem
                                              key={network}
                                              className="flex flex-row items-center space-x-3 space-y-0 p-2 border rounded-md hover:bg-accent/10 mb-1"
                                            >
                                              <FormControl>
                                                <Checkbox
                                                  checked={field.value.includes(network)}
                                                  className="h-5 w-5"
                                                  onCheckedChange={(checked) => {
                                                    return checked
                                                      ? field.onChange([...field.value, network])
                                                      : field.onChange(
                                                          field.value?.filter(
                                                            (value) => value !== network
                                                          )
                                                        )
                                                  }}
                                                />
                                              </FormControl>
                                              <FormLabel className="font-normal w-full cursor-pointer" onClick={() => {
                                                const newChecked = !field.value?.includes(network);
                                                return newChecked
                                                  ? field.onChange([...field.value, network])
                                                  : field.onChange(
                                                      field.value?.filter(
                                                        (value) => value !== network
                                                      )
                                                    )
                                              }}>
                                                {network}
                                              </FormLabel>
                                            </FormItem>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Enable matching to access filtering options</p>
                  )
                  </CardContent>
                </Card>
                
                {/* Floating Save Button */}
                <div className="fixed bottom-16 left-0 right-0 p-4 bg-background border-t border-border shadow-lg z-50">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                    onClick={handleDirectSubmit}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          {/* Collaborations Tab */}
          {/* My Collaborations tab removed as requested */}
        </Tabs>
      </div>
    </div>
  );
}