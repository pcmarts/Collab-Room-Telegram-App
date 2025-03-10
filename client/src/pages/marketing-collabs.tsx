import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
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
  Plus, 
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
  Trash2 
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
  type ApplicationData
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
import { format } from "date-fns";
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
  DialogClose,
  DialogTrigger,
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

// Marketing Collab Schema
const marketingCollabSchema = z.object({
  // Opt-in settings
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("host");
  
  const [filtersEnabled, setFiltersEnabled] = useState({
    topics: false,
    companySectors: false,
    companyFollowers: false,
    userFollowers: false,
    fundingStages: false,
    hasToken: false
  });
  
  // Collabs to host toggle state
  const [collabsToHost, setCollabsToHost] = useState<string[]>([]);
  
  // Live collaborations toggle state
  const [activeCollabs, setActiveCollabs] = useState<Record<string, boolean>>({});
  
  // Delete collaboration dialog state
  const [collabToDelete, setCollabToDelete] = useState<string | null>(null);
  
  // Application detail dialog state
  const [selectedApplication, setSelectedApplication] = useState<CollabApplication | null>(null);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  
  // Application status update
  const [processingApplicationId, setProcessingApplicationId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Fetch existing data
  const { data: profileData, isLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile']
  });
  
  // Fetch user's collaborations
  const { data: collaborations, isLoading: isLoadingCollabs } = useQuery({
    queryKey: ['/api/collaborations/my'],
    queryFn: async () => {
      console.log("Fetching collaborations from /api/collaborations/my");
      const response = await apiRequest('/api/collaborations/my', 'GET');
      if (!response.ok) {
        throw new Error("Failed to fetch collaborations");
      }
      const data = await response.json();
      
      console.log("Received collaborations data:", data);
      
      // Initialize activeCollabs state based on fetched data
      const statusMap: Record<string, boolean> = {};
      data.forEach((collab: Collaboration) => {
        statusMap[collab.id] = collab.status === 'active';
      });
      setActiveCollabs(statusMap);
      
      return data as Collaboration[];
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });
  
  // Fetch user's applications
  const { data: applications, isLoading: isLoadingApps } = useQuery({
    queryKey: ['/api/my-applications'],
    queryFn: async () => {
      const response = await apiRequest('/api/my-applications', 'GET');
      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }
      const data = await response.json();
      return data as CollabApplication[];
    }
  });
  
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
        });
        
        // Refresh the collaborations data
        queryClient.invalidateQueries({ queryKey: ['/api/collaborations/my'] });
        
        // Do not redirect to dashboard, just close the dialog
        // We stay on the current page
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

  // Initialize form with react-hook-form
  const form = useForm<MarketingCollabFormData>({
    resolver: zodResolver(marketingCollabSchema),
    defaultValues: {
      enabledCollabs: [],
      enabledTwitterCollabs: [],
      matchingEnabled: false,
      companySectors: [],
      topics: [],
      fundingStages: [],
      hasToken: false,
      companyFollowers: TWITTER_FOLLOWER_COUNTS[0],
      userFollowers: TWITTER_FOLLOWER_COUNTS[0]
    }
  });

  // Load existing preferences when data is fetched
  useEffect(() => {
    if (profileData) {
      console.log("Loading preferences:", profileData.preferences);
      console.log("Loading marketing preferences:", profileData.marketingPreferences);
      
      // Extract collabs from marketing preferences (if they exist)
      const marketingPrefs = profileData.marketingPreferences || {};
      const savedCollabsToHost = marketingPrefs.collabs_to_host || [];
      const collabsToDiscover = marketingPrefs.collabs_to_discover || [];
      const savedTwitterCollabs = marketingPrefs.twitter_collabs || [];
      
      // Combine to get all enabled collabs
      const uniqueCollabs = new Set([...collabsToDiscover]);
      const enabledCollabs = Array.from(uniqueCollabs);
      
      // Set initial state for collabs to host
      setCollabsToHost(savedCollabsToHost);
      
      // Load filter toggle states from dedicated fields in marketing preferences
      setFiltersEnabled({
        topics: marketingPrefs.discovery_filter_topics_enabled ?? false,
        companySectors: marketingPrefs.discovery_filter_company_sectors_enabled ?? false,
        companyFollowers: marketingPrefs.discovery_filter_company_followers_enabled ?? false,
        userFollowers: marketingPrefs.discovery_filter_user_followers_enabled ?? false,
        fundingStages: marketingPrefs.discovery_filter_funding_stages_enabled ?? false,
        hasToken: marketingPrefs.discovery_filter_token_status_enabled ?? false
      });
      
      console.log("Loaded discovery filter states:", {
        topics: marketingPrefs.discovery_filter_topics_enabled,
        companySectors: marketingPrefs.discovery_filter_company_sectors_enabled,
        companyFollowers: marketingPrefs.discovery_filter_company_followers_enabled,
        userFollowers: marketingPrefs.discovery_filter_user_followers_enabled,
        fundingStages: marketingPrefs.discovery_filter_funding_stages_enabled,
        hasToken: marketingPrefs.discovery_filter_token_status_enabled
      });
      
      // Debug - check if filtered_marketing_topics exists and contains topics
      console.log("Raw filtered_marketing_topics:", JSON.stringify(marketingPrefs.filtered_marketing_topics));

      // Extract filter settings from filtered_marketing_topics
      const excludedTags = marketingPrefs.filtered_marketing_topics || [];
      
      // Initialize filter values with defaults from dedicated fields where available
      let filterMatchingEnabled = marketingPrefs.discovery_filter_enabled ?? false;
      let filterTopics: string[] = [];
      let filterCompanySectors: string[] = [];
      let filterFundingStages: string[] = [];
      let filterCompanyFollowers = TWITTER_FOLLOWER_COUNTS[0] as typeof TWITTER_FOLLOWER_COUNTS[number];
      let filterUserFollowers = TWITTER_FOLLOWER_COUNTS[0] as typeof TWITTER_FOLLOWER_COUNTS[number];
      let filterHasToken = false;
      
      // Directly check for topic tags
      const topicTags = excludedTags.filter(tag => tag.startsWith('filter:topic:'));
      console.log("Topic tags found:", JSON.stringify(topicTags));
      
      // Extract topic values directly from the filter:topic: prefixed tags
      filterTopics = topicTags.map(tag => {
        const value = tag.replace('filter:topic:', '');
        console.log(`Found topic tag: ${tag}, extracted value: ${value}`);
        return value;
      });
      
      // Process each tag to extract other filter settings
      excludedTags.forEach(tag => {
        if (tag.startsWith('filter:')) {
          const [prefix, type, ...valueParts] = tag.split(':');
          const value = valueParts.join(':'); // Rejoin in case value contains colons
          
          switch (type) {
            case 'matching_enabled':
              filterMatchingEnabled = value === 'true';
              break;
            case 'sector':
              filterCompanySectors.push(value);
              break;
            case 'stage':
              filterFundingStages.push(value);
              break;
            case 'company_followers':
              // Ensure value is one of the valid Twitter follower counts
              filterCompanyFollowers = TWITTER_FOLLOWER_COUNTS.includes(value as any) 
                ? value as typeof TWITTER_FOLLOWER_COUNTS[number]
                : TWITTER_FOLLOWER_COUNTS[0];
              break;
            case 'user_followers':
              // Ensure value is one of the valid Twitter follower counts
              filterUserFollowers = TWITTER_FOLLOWER_COUNTS.includes(value as any)
                ? value as typeof TWITTER_FOLLOWER_COUNTS[number]
                : TWITTER_FOLLOWER_COUNTS[0];
              break;
            case 'has_token':
              filterHasToken = value === 'true';
              break;
            case 'section_enabled':
              // We now use the dedicated toggle fields instead
              break;
          }
        }
      });
      
      // Debug log the extracted topics and filter states
      console.log("Extracted topics:", filterTopics);
      
      console.log("Loaded filter settings:", {
        filterMatchingEnabled,
        filterTopics,
        filterCompanySectors,
        filterFundingStages,
        filterCompanyFollowers,
        filterUserFollowers,
        filterHasToken
      });
      
      // Reset form with loaded values
      form.reset({
        enabledCollabs,
        enabledTwitterCollabs: savedTwitterCollabs,
        matchingEnabled: filterMatchingEnabled,
        companySectors: filterCompanySectors,
        topics: filterTopics,
        fundingStages: filterFundingStages,
        hasToken: filterHasToken,
        companyFollowers: filterCompanyFollowers,
        userFollowers: filterUserFollowers
      });
      
      // Filter section toggle states are now loaded directly from dedicated fields
    }
  }, [profileData, form]);

  // Toggle filter visibility
  const toggleFilter = (filterName: keyof typeof filtersEnabled) => {
    setFiltersEnabled((prev) => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
  };
  
  // Handle collabs to host toggle
  const handleCollabsToHostToggle = (collabType: string) => {
    setCollabsToHost(prev => 
      prev.includes(collabType) 
        ? prev.filter(item => item !== collabType) 
        : [...prev, collabType]
    );
  };
  
  // Get matchingEnabled value from form
  const matchingEnabled = form.watch("matchingEnabled");

  const onSubmit = async (data: MarketingCollabFormData) => {
    setIsSubmitting(true);
    console.log("🔴 FORM SUBMISSION STARTED");
    console.log("🔴 Form data:", JSON.stringify(data));
    console.log("🔴 Topics selected:", JSON.stringify(data.topics));
    
    // Get the raw form state for debugging
    console.log("🔴 Raw form state:", form.getValues());
    console.log("🔴 Direct form topics array:", form.getValues("topics"));

    try {
      // Make sure data.topics is properly initialized and handle array or undefined
      const selectedTopics = Array.isArray(data.topics) ? data.topics : [];
      console.log("Selected topics (validated):", JSON.stringify(selectedTopics));
      console.log("Topics from form data:", JSON.stringify(data.topics));
      console.log("Form values:", JSON.stringify(form.getValues()));
      
      // Add extra debug output for the checkbox values
      if (data.topics === undefined || (Array.isArray(data.topics) && data.topics.length === 0)) {
        console.warn("⚠️ No topics were selected in the form!");
      }
      
      // Explicitly check each checkbox in the COLLAB_TOPICS array to see what's checked
      console.log("Explicitly checking each topic checkbox:");
      const checkboxValues = {};
      COLLAB_TOPICS.forEach(topic => {
        const isChecked = selectedTopics.includes(topic);
        checkboxValues[topic] = isChecked;
      });
      console.log("Individual topic checkbox states:", JSON.stringify(checkboxValues));
      
      // Get topics directly from the form for consistency
      const formTopics = form.getValues("topics");
      const validatedTopics = Array.isArray(formTopics) ? formTopics : [];
      
      console.log("⭐ Topics from form VALUES:", JSON.stringify(validatedTopics));
      console.log("⭐ Topics from form DATA:", JSON.stringify(data.topics));
      console.log("⭐ Topics from initial SELECTED TOPICS:", JSON.stringify(selectedTopics));
      
      // Get the final topics to save from the form, using direct access to form values
      // for the most accurate representation of the current state
      const formValues = form.getValues();
      
      // COMPLETE REWRITE OF TOPIC EXTRACTION
      // This is a critical section that needs careful handling
      
      // Print the current state of all checkbox elements for debugging
      let checkboxStates: Record<string, boolean> = {};
      document.querySelectorAll('input[type="checkbox"][name^="topics"]').forEach((element) => {
        // Cast the Element to HTMLInputElement
        const checkbox = element as HTMLInputElement;
        const value = checkbox.value;
        const isChecked = checkbox.checked;
        checkboxStates[value] = isChecked;
        console.log(`🔍 Checkbox "${value}" is ${isChecked ? "CHECKED" : "unchecked"}`);
      });
      console.log("📋 ALL checkbox states:", checkboxStates);
      
      // Get all checked topics directly from the DOM (most reliable method)
      const checkedTopics = Array.from(
        document.querySelectorAll('input[type="checkbox"][name^="topics"]:checked')
      ).map((element) => (element as HTMLInputElement).value);
      
      console.log("⭐⭐⭐ DIRECTLY CHECKED TOPICS FROM DOM:", JSON.stringify(checkedTopics));
      
      // Convert filter settings to strings that can be stored in filtered_marketing_topics
      // Use a prefix to separate these from actual excluded tags
      const filterTopics = checkedTopics.map(topic => `filter:topic:${topic}`);
      console.log("Mapped filter topics:", JSON.stringify(filterTopics));
      
      const filterSectors = Array.isArray(data.companySectors) ? 
        data.companySectors.map(sector => `filter:sector:${sector}`) : [];
        
      const filterFundingStages = Array.isArray(data.fundingStages) ?
        data.fundingStages.map(stage => `filter:stage:${stage}`) : [];
      
      // Store all filter metadata with prefixes in an array
      // Also save the filter section toggle states
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
        ...filterTopics,
        ...filterSectors,
        ...filterFundingStages,
        ...filterMetadata
      ];
      
      console.log("Saving filter data:", allFilterData);
      console.log("Number of filter topics:", filterTopics.length);
      
      // Save preferences using the existing fields in the database
      // IMPORTANT: We need to filter out any existing filter settings from the filtered_marketing_topics
      // before adding our new ones to prevent duplicates or old settings persisting
      const existingTags = profileData?.marketingPreferences?.filtered_marketing_topics || [];
      const nonFilterTags = existingTags.filter(tag => !tag.startsWith('filter:'));
      
      // Make sure we have a default for notification_frequency as it's required
      const notification_frequency = profileData?.preferences?.notification_frequency || "Daily";
      
      // For general preferences we only need notification frequency now
      const generalPrefsData = {
        notification_frequency
      };
      
      console.log("Saving filter toggle states:", {
        discovery_filter_enabled: data.matchingEnabled,
        discovery_filter_topics_enabled: filtersEnabled.topics,
        discovery_filter_company_sectors_enabled: filtersEnabled.companySectors,
        discovery_filter_company_followers_enabled: filtersEnabled.companyFollowers,
        discovery_filter_user_followers_enabled: filtersEnabled.userFollowers,
        discovery_filter_funding_stages_enabled: filtersEnabled.fundingStages,
        discovery_filter_token_status_enabled: filtersEnabled.hasToken
      });

      // First update the marketing preferences with the filter settings
      // Create a copy of the filter data array to make sure it's not modified
      const filteredTopicsCopy = [...allFilterData];
      
      console.log("🔵 Final allFilterData before creating marketingPrefsData:", JSON.stringify(filteredTopicsCopy));
      console.log("🔵 Number of topic entries:", filteredTopicsCopy.filter(item => item.startsWith('filter:topic:')).length);
      
      const marketingPrefsData = {
        collabs_to_discover: data.enabledCollabs,
        collabs_to_host: collabsToHost,
        twitter_collabs: data.enabledTwitterCollabs,
        filtered_marketing_topics: [...nonFilterTags, ...filteredTopicsCopy],
        discovery_filter_enabled: data.matchingEnabled,
        discovery_filter_topics_enabled: filtersEnabled.topics,
        discovery_filter_company_sectors_enabled: filtersEnabled.companySectors,
        discovery_filter_company_followers_enabled: filtersEnabled.companyFollowers,
        discovery_filter_user_followers_enabled: filtersEnabled.userFollowers,
        discovery_filter_funding_stages_enabled: filtersEnabled.fundingStages,
        discovery_filter_token_status_enabled: filtersEnabled.hasToken
      };
      
      console.log("🔵 Final marketingPrefsData being sent to server:", JSON.stringify(marketingPrefsData));
      
      const marketingResponse = await apiRequest('/api/marketing-preferences', 'POST', marketingPrefsData);
      
      if (!marketingResponse.ok) {
        throw new Error('Failed to update marketing preferences');
      }
      
      // Log marketing preferences response
      try {
        const marketingData = await marketingResponse.clone().json();
        console.log("Marketing preferences response:", marketingData);
        
        // Specifically check if topics are saved
        if (marketingData.marketingPrefs?.filtered_marketing_topics) {
          console.log("Saved topics:", marketingData.marketingPrefs.filtered_marketing_topics.filter(t => t.startsWith('filter:topic:')).map(t => t.replace('filter:topic:', '')));
        }
      } catch (e) {
        console.error("Could not parse marketing response:", e);
      }
      
      // Then update general preferences with notification frequency
      const response = await apiRequest('/api/preferences', 'POST', generalPrefsData);

      if (!response.ok) {
        throw new Error('Failed to update general preferences');
      }

      // Invalidate profile data to refresh the UI with new settings
      await queryClient.invalidateQueries({ queryKey: ['/api/profile'] });

      toast({
        title: "Success!",
        description: "Your marketing collaboration preferences have been updated",
        duration: 2000
      });

      // Stay on this page after saving preferences
      // Only redirect when user explicitly wants to go to dashboard
    } catch (error) {
      console.error('Failed to update collaborations:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update collaborations"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render a collaboration card
  const renderCollaborationCard = (collab: Collaboration) => {
    // Get applications data from the applications array state
    const pendingApplications = applications?.filter(app => 
      app.collaboration_id === collab.id && app.status === 'pending'
    ) || [];
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCollabToDelete(collab.id);
                }}
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
    // Parse the application data - add a type assertion for message field
    const messageData = application.message ? JSON.parse(application.message) : {};
    
    // Get status badge variant
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
  
  // Render skeleton loaders
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
  
  // Render application details for dialog
  const renderApplicationDetails = () => {
    if (!selectedApplication) return null;
    
    // Simplified application display using only the message field
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100svh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-background">
      {/* Delete Confirmation Dialog - Outside the form */}
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
            <AlertDialogCancel onClick={() => setCollabToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCollaboration}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    
      <PageHeader
        title="Marketing Collabs"
        subtitle="Select your preferred collaboration types"
        backUrl="/dashboard"
      />

      <Tabs defaultValue="host" onValueChange={setActiveTab}>
        <div className="sticky top-0 z-10 bg-background px-4 pt-4 pb-2 border-b">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="host">👋 Hosting</TabsTrigger>
            <TabsTrigger value="optin"> 🚀 Discovery Feed</TabsTrigger>
          </TabsList>
        </div>

        <div className="p-4 space-y-6 pt-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative pb-20">
              <TabsContent value="optin" className="space-y-4 mt-0">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label className="text-lg">Discovery feed settings</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select the types of marketing collabs hosted by others shown on your discovery feed
                    </p>
                  </div>
                </div>
                
                {/* Filter Panel - Always visible */}
                {(
                  <div className="space-y-4 mb-6 border rounded-lg p-4 bg-accent/10">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium">Discovery Feed Filters</h3>
                      <FormField
                        control={form.control}
                        name="matchingEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormLabel className="font-normal">Enable Filtering</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {matchingEnabled && (
                      <div className="space-y-6 pt-2">
                        {/* Topics Filter */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3 mb-1">
                            <Switch
                              checked={filtersEnabled.topics}
                              onCheckedChange={() => toggleFilter("topics")}
                            />
                            <Label>Filter by Topics</Label>
                          </div>

                          {filtersEnabled.topics && (
                            <div className="space-y-2">
                              <p className="text-sm mb-2">Select topics of interest:</p>
                              <div className="grid grid-cols-2 gap-2">
                                {COLLAB_TOPICS.map((topic) => {
                                  // Create a unique id for this topic checkbox
                                  const checkboxId = `topic-checkbox-${topic.replace(/\s+/g, '-').toLowerCase()}`;
                                  
                                  // Get current topics array from form
                                  const topics = form.watch("topics") || [];
                                  const isChecked = Array.isArray(topics) && topics.includes(topic);
                                  
                                  return (
                                    <div key={topic} className="flex items-center space-x-2">
                                      <Checkbox 
                                        id={checkboxId}
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          // Get the current value to work with
                                          const currentTopics = Array.isArray(form.getValues("topics")) 
                                            ? [...form.getValues("topics")] 
                                            : [];
                                          
                                          console.log(`Topic ${topic} changed to ${checked ? 'checked' : 'unchecked'}`);
                                          
                                          let newTopics;
                                          if (checked) {
                                            // Add the topic if it's not already in the array
                                            if (!currentTopics.includes(topic)) {
                                              newTopics = [...currentTopics, topic];
                                            } else {
                                              newTopics = currentTopics;
                                            }
                                          } else {
                                            // Remove the topic
                                            newTopics = currentTopics.filter(t => t !== topic);
                                          }
                                          
                                          console.log(`Topics after change:`, newTopics);
                                          
                                          // Update the form
                                          form.setValue("topics", newTopics, { 
                                            shouldValidate: true,
                                            shouldDirty: true,
                                            shouldTouch: true
                                          });
                                        }}
                                      />
                                      <label 
                                        htmlFor={checkboxId}
                                        className="text-sm font-normal cursor-pointer"
                                      >
                                        {topic}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* More filters */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3 mb-1">
                            <Switch
                              checked={filtersEnabled.companyFollowers}
                              onCheckedChange={() => toggleFilter("companyFollowers")}
                            />
                            <Label>Minimum Company Followers</Label>
                          </div>

                          {filtersEnabled.companyFollowers && (
                            <FormField
                              control={form.control}
                              name="companyFollowers"
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select min followers" />
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
                          )}
                        </div>
                        
                        {/* Filter settings are automatically applied on save */}
                      </div>
                    )}
                  </div>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Discovery Feed: Collab Types</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Select which types of collaborations for your company to be matched with as a participant
                    </p>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="enabledCollabs"
                      render={({ field }) => (
                        <FormItem>
                          <div className="grid grid-cols-1 gap-2">
                            {COLLAB_TYPES.map((collabType) => (
                              <FormItem
                                key={collabType}
                                className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(collabType)}
                                    onCheckedChange={(checked) => {
                                      const currentTypes = field.value || [];
                                      if (checked) {
                                        field.onChange([...currentTypes, collabType]);
                                      } else {
                                        field.onChange(
                                          currentTypes.filter(
                                            (value) => value !== collabType
                                          )
                                        );
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">{collabType}</FormLabel>
                              </FormItem>
                            ))}
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Twitter Co-Marketing Section - Conditional */}
                {form.watch("enabledCollabs")?.includes("Co-Marketing on Twitter") && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Twitter Co-Marketing Opportunities</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Choose specific Twitter collaboration formats you'd like your company to participate in
                      </p>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="enabledTwitterCollabs"
                        render={({ field }) => (
                          <FormItem>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <h3 className="text-sm font-medium border-b pb-1 mb-2">Content Creation</h3>
                                <div className="grid grid-cols-1 gap-2">
                                  {["Thread Collab", "Joint Campaign"].map((type) => (
                                    <FormItem 
                                      key={type} 
                                      className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(type)}
                                          onCheckedChange={(checked) => {
                                            const currentTypes = field.value || [];
                                            if (checked) {
                                              field.onChange([...currentTypes, type]);
                                            } else {
                                              field.onChange(currentTypes.filter(v => v !== type));
                                            }
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">{type}</FormLabel>
                                    </FormItem>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h3 className="text-sm font-medium border-b pb-1 mb-2">User Engagement</h3>
                                <div className="grid grid-cols-1 gap-2">
                                  {["Giveaway", "Poll/Q&A", "AMA"].map((type) => (
                                    <FormItem 
                                      key={type} 
                                      className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(type)}
                                          onCheckedChange={(checked) => {
                                            const currentTypes = field.value || [];
                                            if (checked) {
                                              field.onChange([...currentTypes, type]);
                                            } else {
                                              field.onChange(currentTypes.filter(v => v !== type));
                                            }
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">{type}</FormLabel>
                                    </FormItem>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h3 className="text-sm font-medium border-b pb-1 mb-2">Audience Building</h3>
                                <div className="grid grid-cols-1 gap-2">
                                  {["Twitter Space Co-Host", "Retweet & Boost", "Shoutout"].map((type) => (
                                    <FormItem 
                                      key={type} 
                                      className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(type)}
                                          onCheckedChange={(checked) => {
                                            const currentTypes = field.value || [];
                                            if (checked) {
                                              field.onChange([...currentTypes, type]);
                                            } else {
                                              field.onChange(currentTypes.filter(v => v !== type));
                                            }
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">{type}</FormLabel>
                                    </FormItem>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}
                
                {/* Individual tab save button removed - now using persistent button */}
              </TabsContent>
              
              <TabsContent value="host" className="space-y-4 mt-0">
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label className="text-lg">Host a Marketing Collab</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Create and manage marketing collaborations that others can apply to join                     </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setLocation('/create-collaboration')}
                      className="flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New
                    </Button>
                  </div>
                  
                  {isLoadingCollabs ? (
                    renderSkeletons()
                  ) : !collaborations || collaborations.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <p className="text-muted-foreground mb-4">You don't have any active collaborations yet</p>
                        <Button 
                          onClick={() => setLocation('/create-collaboration')}
                          className="flex items-center"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Collaboration
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {collaborations.map(collab => renderCollaborationCard(collab))}
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
                  

                </div>
              </TabsContent>

              <TabsContent value="criteria" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Match Filtering</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Enable to filter potential marketing collaboration matches
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="matchingEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base text-primary">
                              Enable Collaboration Filtering
                            </FormLabel>
                            <FormDescription>
                              {field.value
                                ? "Filtering enabled - you'll see matches based on criteria"
                                : "Filtering disabled - you'll see all collaboration opportunities"}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {matchingEnabled && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Filtering Criteria (optional)</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Set requirements for collaboration matches
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Topics Filter */}
                      <div className="flex items-center space-x-3 mb-4">
                        <Switch
                          checked={filtersEnabled.topics}
                          onCheckedChange={() => toggleFilter("topics")}
                        />
                        <Label>Filter by Topics</Label>
                      </div>

                      {filtersEnabled.topics && (
                        <FormField
                          control={form.control}
                          name="topics"
                          render={({ field }) => (
                            <FormItem>
                              <div className="grid grid-cols-2 gap-2">
                                {COLLAB_TOPICS.map((topic) => (
                                  <FormItem
                                    key={topic}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        id={`topic-checkbox-${topic.toLowerCase().replace(/\s+/g, '-')}`}
                                        name={`topics.${topic}`}
                                        value={topic}
                                        checked={Array.isArray(field.value) && field.value.includes(topic)}
                                        onCheckedChange={(checked) => {
                                          console.log(`🎯 Topic ${topic} checkbox changed to: ${checked}`);
                                          
                                          // Ensure we're dealing with an array, initialize empty array if needed
                                          const currentTopics = Array.isArray(field.value) ? [...field.value] : [];
                                          console.log(`🎯 Current topics BEFORE update:`, currentTopics);
                                          
                                          let newValue;
                                          if (checked) {
                                            // Only add if not already present
                                            if (!currentTopics.includes(topic)) {
                                              newValue = [...currentTopics, topic];
                                              console.log(`🎯 Adding topic ${topic}, new value:`, newValue);
                                            } else {
                                              // No change needed
                                              newValue = currentTopics; 
                                            }
                                          } else {
                                            // Remove the topic
                                            newValue = currentTopics.filter(value => value !== topic);
                                            console.log(`🎯 Removing topic ${topic}, new value:`, newValue);
                                          }
                                          
                                          // Always update both ways to ensure consistency
                                          field.onChange(newValue);
                                          form.setValue('topics', newValue, { 
                                            shouldValidate: true,
                                            shouldDirty: true,
                                            shouldTouch: true
                                          });
                                          
                                          // Verify the update was applied correctly
                                          console.log(`🎯 Form topics after update:`, form.getValues().topics);
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">
                                      {topic}
                                    </FormLabel>
                                  </FormItem>
                                ))}
                              </div>
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Company Sectors Filter */}
                      <div className="flex items-center space-x-3 mb-4">
                        <Switch
                          checked={filtersEnabled.companySectors}
                          onCheckedChange={() => toggleFilter("companySectors")}
                        />
                        <Label>Filter by Company Sectors</Label>
                      </div>

                      {filtersEnabled.companySectors && (
                        <FormField
                          control={form.control}
                          name="companySectors"
                          render={({ field }) => (
                            <FormItem>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(COMPANY_TAG_CATEGORIES).map(
                                  ([category, tags]) => (
                                    <div
                                      key={category}
                                      className="space-y-2 mb-4"
                                    >
                                      <Label className="font-medium">
                                        {category}
                                      </Label>
                                      <div className="space-y-2">
                                        {tags.map((tag) => (
                                          <FormItem
                                            key={tag}
                                            className="flex flex-row items-start space-x-3 space-y-0"
                                          >
                                            <FormControl>
                                              <Checkbox
                                                checked={Array.isArray(field.value) && field.value.includes(tag)}
                                                onCheckedChange={(checked) => {
                                                  // Ensure we're dealing with an array 
                                                  const currentTags = Array.isArray(field.value) ? [...field.value] : [];
                                                  
                                                  if (checked) {
                                                    // Only add if not already present
                                                    if (!currentTags.includes(tag)) {
                                                      const newValue = [...currentTags, tag];
                                                      field.onChange(newValue);
                                                      
                                                      // Update the form value directly for consistency
                                                      form.setValue('companySectors', newValue);
                                                    }
                                                  } else {
                                                    const newValue = currentTags.filter(value => value !== tag);
                                                    field.onChange(newValue);
                                                    
                                                    // Update the form value directly for consistency
                                                    form.setValue('companySectors', newValue);
                                                  }
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
                                  )
                                )}
                              </div>
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Twitter Followers Filter - Company */}
                      <div className="flex items-center space-x-3 mb-4">
                        <Switch
                          checked={filtersEnabled.companyFollowers}
                          onCheckedChange={() => toggleFilter("companyFollowers")}
                        />
                        <Label>Minimum Company Followers</Label>
                      </div>

                      {filtersEnabled.companyFollowers && (
                        <FormField
                          control={form.control}
                          name="companyFollowers"
                          render={({ field }) => (
                            <FormItem>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select min followers" />
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
                      )}

                      {/* Twitter Followers Filter - User */}
                      <div className="flex items-center space-x-3 mb-4">
                        <Switch
                          checked={filtersEnabled.userFollowers}
                          onCheckedChange={() => toggleFilter("userFollowers")}
                        />
                        <Label>Minimum User Followers</Label>
                      </div>

                      {filtersEnabled.userFollowers && (
                        <FormField
                          control={form.control}
                          name="userFollowers"
                          render={({ field }) => (
                            <FormItem>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select min followers" />
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
                      )}

                      {/* Funding Stages Filter */}
                      <div className="flex items-center space-x-3 mb-4">
                        <Switch
                          checked={filtersEnabled.fundingStages}
                          onCheckedChange={() => toggleFilter("fundingStages")}
                        />
                        <Label>Funding Stages</Label>
                      </div>

                      {filtersEnabled.fundingStages && (
                        <FormField
                          control={form.control}
                          name="fundingStages"
                          render={({ field }) => (
                            <FormItem>
                              <div className="grid grid-cols-2 gap-2">
                                {FUNDING_STAGES.map((stage) => (
                                  <FormItem
                                    key={stage}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={Array.isArray(field.value) && field.value.includes(stage)}
                                        onCheckedChange={(checked) => {
                                          // Ensure we're dealing with an array
                                          const currentStages = Array.isArray(field.value) ? [...field.value] : [];
                                          
                                          if (checked) {
                                            // Only add if not already present
                                            if (!currentStages.includes(stage)) {
                                              const newValue = [...currentStages, stage];
                                              field.onChange(newValue);
                                              
                                              // Update the form value directly for consistency
                                              form.setValue('fundingStages', newValue);
                                            }
                                          } else {
                                            const newValue = currentStages.filter(value => value !== stage);
                                            field.onChange(newValue);
                                            
                                            // Update the form value directly for consistency
                                            form.setValue('fundingStages', newValue);
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">
                                      {stage}
                                    </FormLabel>
                                  </FormItem>
                                ))}
                              </div>
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Token Status Filter */}
                      <div className="flex items-center space-x-3 mb-4">
                        <Switch
                          checked={filtersEnabled.hasToken}
                          onCheckedChange={() => toggleFilter("hasToken")}
                        />
                        <Label>Has Token</Label>
                      </div>

                      {filtersEnabled.hasToken && (
                        <FormField
                          control={form.control}
                          name="hasToken"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <FormLabel>Company must have a token</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              {/* Persistent Save Button */}
              <div className="fixed bottom-0 left-0 right-0 py-4 px-4 bg-background border-t shadow-md z-10">
                <Button 
                  className="w-full"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </Tabs>
    </div>
  );
}
