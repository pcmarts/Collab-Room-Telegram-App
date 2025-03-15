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
  // This component file includes the updated UI pattern for category-specific selection count badges

  // Same state management as original file
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const formRef = useRef<HTMLFormElement>(null);
  
  // Core state management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') === 'my' ? 'collaborations' : 'preferences';
  });
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [collabsToHost, setCollabsToHost] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Add the missing toggleFilter function
  const toggleFilter = (filterName: keyof typeof filtersEnabled) => {
    setFiltersEnabled(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const [filtersEnabled, setFiltersEnabled] = useState({
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
  
  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  // Example implementation of the required UI components
  // Focus on the CompanySectors FormField with added category-specific selection count badges
  
  return (
    <div className="container mx-auto py-6">
      <PageHeader 
        title="Marketing Collaborations" 
        subtitle="Discover and manage collaboration opportunities" 
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preferences">My Preferences</TabsTrigger>
          <TabsTrigger value="collaborations">My Collaborations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preferences" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Set Your Marketing Collaboration Preferences</CardTitle>
              <CardDescription>
                These settings determine which collaboration opportunities you'll discover
                and who can find your collaborations.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <form ref={formRef} className="space-y-6">
                  {/* Example of the updated Company Sectors field with category badges */}
                  <FormField
                    control={form.control}
                    name="companySectors"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-4">
                          {/* Overall selection count */}
                          {field.value.length > 0 && (
                            <div className="flex justify-between items-center">
                              <Badge variant="secondary" className="text-xs">
                                {field.value.length} {field.value.length === 1 ? 'sector' : 'sectors'} selected
                              </Badge>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm"
                                onClick={() => field.onChange([])}
                              >
                                Clear
                              </Button>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center mb-2">
                            <FormLabel className="text-base">Company Sectors</FormLabel>
                            <Switch 
                              checked={filtersEnabled.companySectors}
                              onCheckedChange={() => toggleFilter('companySectors')}
                            />
                          </div>
                          
                          <FormDescription>
                            Select the business sectors you're interested in collaborating with.
                          </FormDescription>
                          
                          {/* Categorized sector selection with per-category badges */}
                          {Object.entries(COMPANY_TAG_CATEGORIES).map(([category, tags]) => (
                            <div key={category} className="border rounded p-3">
                              <div 
                                className="flex justify-between items-center cursor-pointer mb-2"
                                onClick={() => toggleCategory(category)}
                              >
                                <div className="font-medium">{category}</div>
                                <div className="flex items-center gap-2">
                                  {/* Category-specific selection count badge */}
                                  {field.value.filter(tag => tags.includes(tag)).length > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      {(field.value as string[]).filter(tag => tags.includes(tag)).length}
                                    </Badge>
                                  )}
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
                  
                  {/* Blockchain Networks would follow a similar pattern */}
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}