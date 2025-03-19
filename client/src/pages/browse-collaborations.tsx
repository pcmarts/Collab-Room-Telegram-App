import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, RouteComponentProps } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  CalendarDays, 
  Coins, 
  Filter, 
  Twitter,
  Users,
  Clock,
  Tag,
  CheckCircle,
  ChevronRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MobileCheck } from "@/components/MobileCheck";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader } from "@/components/layout/PageHeader";

import {
  COLLAB_TYPES,
  COMPANY_TAG_CATEGORIES,
  TWITTER_FOLLOWER_COUNTS,
  FUNDING_STAGES,
  BLOCKCHAIN_NETWORKS,
  BLOCKCHAIN_NETWORK_CATEGORIES,
  ALL_COMPANY_TAGS,
  type Collaboration,
} from "@shared/schema";

// Filter interface for collaborations
interface CollaborationFilters {
  collabTypes: string[];
  companyTags: string[];
  minCompanyFollowers: string;
  minUserFollowers: string;
  hasToken: boolean;
  fundingStages: string[];
  blockchainNetworks: string[]; // Added blockchain networks filter
}

interface BrowseCollaborationsProps {
  id?: string;
}

export default function BrowseCollaborations({ id }: BrowseCollaborationsProps = {}) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Filter state
  const [filters, setFilters] = useState<CollaborationFilters>({
    collabTypes: [],
    companyTags: [],
    minCompanyFollowers: "",
    minUserFollowers: "",
    hasToken: false,
    fundingStages: [],
    blockchainNetworks: [],
  });
  
  // Filter open state (for mobile)
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Search term
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  
  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);
  
  // Query for a single collaboration if ID is provided
  const { data: singleCollaboration, isLoading: isSingleLoading, isError: isSingleError } = useQuery({
    queryKey: ["/api/collaborations/get", id],
    queryFn: async () => {
      if (!id) return null;
      
      const response = await apiRequest('GET', `/api/collaborations/get/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch collaboration");
      }
      
      return response.json() as Promise<Collaboration>;
    },
    enabled: !!id
  });

  // Query collaborations with filters (only when not viewing a single collaboration)
  const { data: collaborations, isLoading: isListLoading, isError: isListError, refetch } = useQuery({
    queryKey: [
      "/api/collaborations/search", 
      filters, 
      debouncedSearchTerm
    ],
    queryFn: async () => {
      let queryParams = new URLSearchParams();
      
      // Add filters to query params
      if (filters.collabTypes.length > 0) {
        filters.collabTypes.forEach(type => {
          queryParams.append("collabTypes", type);
        });
      }
      
      if (filters.companyTags.length > 0) {
        filters.companyTags.forEach(tag => {
          queryParams.append("companyTags", tag);
        });
      }
      
      if (filters.minCompanyFollowers) {
        queryParams.append("minCompanyFollowers", filters.minCompanyFollowers);
      }
      
      if (filters.minUserFollowers) {
        queryParams.append("minUserFollowers", filters.minUserFollowers);
      }
      
      if (filters.hasToken) {
        queryParams.append("hasToken", "true");
      }
      
      if (filters.fundingStages.length > 0) {
        filters.fundingStages.forEach(stage => {
          queryParams.append("fundingStages", stage);
        });
      }
      
      if (filters.blockchainNetworks.length > 0) {
        filters.blockchainNetworks.forEach(network => {
          queryParams.append("blockchainNetworks", network);
        });
      }
      
      if (debouncedSearchTerm) {
        queryParams.append("search", debouncedSearchTerm);
      }
      
      // Build URL with query params
      const url = `/api/collaborations/search?${queryParams.toString()}`;
      
      const response = await apiRequest('GET', url);
      if (!response.ok) {
        throw new Error("Failed to fetch collaborations");
      }
      
      return response.json() as Promise<Collaboration[]>;
    },
    enabled: !id
  });

  // Handler for applying to a collaboration
  const handleApply = (collabId: string) => {
    setLocation(`/apply/${collabId}`);
  };
  
  // Handler for viewing a single collaboration
  const handleViewCollaboration = (collabId: string) => {
    setLocation(`/collaboration/${collabId}`);
  };
  
  // Handler for toggling a filter value
  const toggleFilterValue = (filterName: keyof CollaborationFilters, value: string) => {
    setFilters(prev => {
      if (Array.isArray(prev[filterName])) {
        const currentArray = prev[filterName] as string[];
        if (currentArray.includes(value)) {
          return {
            ...prev,
            [filterName]: currentArray.filter(v => v !== value)
          };
        } else {
          return {
            ...prev,
            [filterName]: [...currentArray, value]
          };
        }
      }
      return prev;
    });
  };
  
  // Handler for setting a filter value
  const setFilterValue = (filterName: keyof CollaborationFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };
  
  // Handler for clearing all filters
  const clearFilters = () => {
    setFilters({
      collabTypes: [],
      companyTags: [],
      minCompanyFollowers: "",
      minUserFollowers: "",
      hasToken: false,
      fundingStages: [],
      blockchainNetworks: [],
    });
    setSearchTerm("");
    setDebouncedSearchTerm("");
  };
  
  // Filter component
  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-3">Collaboration Types</h3>
        <div className="space-y-2">
          {COLLAB_TYPES.map(type => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox 
                id={`type-${type}`}
                checked={filters.collabTypes.includes(type)}
                onCheckedChange={() => toggleFilterValue("collabTypes", type)}
              />
              <label 
                htmlFor={`type-${type}`}
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {type}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="font-medium mb-3">Company Tags</h3>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {ALL_COMPANY_TAGS.map(tag => (
            <div key={tag} className="flex items-center space-x-2">
              <Checkbox
                id={`tag-${tag}`}
                checked={filters.companyTags.includes(tag)}
                onCheckedChange={() => toggleFilterValue("companyTags", tag)}
              />
              <label
                htmlFor={`tag-${tag}`}
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {tag}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="font-medium mb-3">Minimum Followers</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm block mb-2">Company Twitter Followers</label>
            <Select
              value={filters.minCompanyFollowers}
              onValueChange={(value) => setFilterValue("minCompanyFollowers", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="No minimum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No minimum</SelectItem>
                {TWITTER_FOLLOWER_COUNTS.map(count => (
                  <SelectItem key={count} value={count}>{count}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm block mb-2">User Twitter Followers</label>
            <Select
              value={filters.minUserFollowers}
              onValueChange={(value) => setFilterValue("minUserFollowers", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="No minimum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No minimum</SelectItem>
                {TWITTER_FOLLOWER_COUNTS.map(count => (
                  <SelectItem key={count} value={count}>{count}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="font-medium mb-3">Token & Funding</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has-token"
              checked={filters.hasToken}
              onCheckedChange={(checked) => setFilterValue("hasToken", !!checked)}
            />
            <label
              htmlFor="has-token"
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Has Token
            </label>
          </div>
          
          <div className="mt-4">
            <label className="text-sm block mb-2">Funding Stages</label>
            <div className="space-y-2">
              {FUNDING_STAGES.map(stage => (
                <div key={stage} className="flex items-center space-x-2">
                  <Checkbox
                    id={`stage-${stage}`}
                    checked={filters.fundingStages.includes(stage)}
                    onCheckedChange={() => toggleFilterValue("fundingStages", stage)}
                  />
                  <label
                    htmlFor={`stage-${stage}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {stage}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="font-medium mb-3">Blockchain Networks</h3>
        <div className="space-y-4">
          {Object.entries(BLOCKCHAIN_NETWORK_CATEGORIES).map(([category, networks]) => (
            <div key={category} className="space-y-2">
              <h4 className="text-sm font-medium">{category}</h4>
              <div className="space-y-2 ml-2">
                {([...networks] as string[]).map(network => (
                  <div key={network} className="flex items-center space-x-2">
                    <Checkbox
                      id={`network-${network}`}
                      checked={filters.blockchainNetworks.includes(network)}
                      onCheckedChange={() => toggleFilterValue("blockchainNetworks", network)}
                    />
                    <label
                      htmlFor={`network-${network}`}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {network}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="pt-4">
        <Button 
          onClick={clearFilters} 
          variant="outline" 
          className="w-full"
        >
          Clear All Filters
        </Button>
      </div>
    </div>
  );
  
  // Render collaboration card
  const renderCollaborationCard = (collab: Collaboration) => (
    <Card key={collab.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <Badge className="mb-2">{collab.collab_type}</Badge>
            <CardTitle className="text-xl">{collab.title}</CardTitle>
          </div>
          {collab.details && typeof collab.details === 'object' && 'has_token' in collab.details && collab.details.has_token && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Coins className="h-3 w-3" /> Token
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {collab.details && typeof collab.details === 'object' && 
            (collab.details.short_description || collab.details.description || 
             (collab.details.goals || "No description available"))}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <CalendarDays className="h-3 w-3" />
            <span>{collab.date_type === 'flexible' ? 'Flexible timing' : 'Specific date'}</span>
          </div>
          
          {collab.details && typeof collab.details === 'object' && 'has_compensation' in collab.details && collab.details.has_compensation && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Coins className="h-3 w-3" />
              <span>Paid opportunity</span>
            </div>
          )}
          
          {collab.details && typeof collab.details === 'object' && 'required_min_followers' in collab.details && collab.details.required_min_followers && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Twitter className="h-3 w-3" />
              <span>Min {collab.details.required_min_followers} followers</span>
            </div>
          )}
        </div>
        
        {collab.required_company_sectors && collab.required_company_sectors.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {Array.isArray(collab.required_company_sectors) && 
              collab.required_company_sectors.slice(0, 3).map((sector, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {sector}
                </Badge>
              ))
            }
            {Array.isArray(collab.required_company_sectors) && 
              collab.required_company_sectors.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{collab.required_company_sectors.length - 3} more
                </Badge>
              )
            }
          </div>
        )}
        
        {/* Display blockchain networks if available */}
        {collab.company_blockchain_networks && collab.company_blockchain_networks.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            <div className="w-full text-xs text-gray-500 mb-1">Blockchain Networks:</div>
            {Array.isArray(collab.company_blockchain_networks) && 
              collab.company_blockchain_networks.slice(0, 3).map((network, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {network}
                </Badge>
              ))
            }
            {Array.isArray(collab.company_blockchain_networks) && 
              collab.company_blockchain_networks.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{collab.company_blockchain_networks.length - 3} more
                </Badge>
              )
            }
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button 
          onClick={() => handleViewCollaboration(collab.id)} 
          variant="outline"
          className="flex-1"
        >
          View Details
        </Button>
        <Button 
          onClick={() => handleApply(collab.id)} 
          className="flex-1"
        >
          Apply
        </Button>
      </CardFooter>
    </Card>
  );
  
  // Loading skeleton
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
            <div className="flex gap-1 mb-3">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
  
  // Render single collaboration detail view
  const renderSingleCollaboration = () => {
    if (!singleCollaboration) return null;
    
    return (
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <Badge className="mb-2">{singleCollaboration.collab_type}</Badge>
                <CardTitle className="text-xl">{singleCollaboration.title}</CardTitle>
              </div>
              {singleCollaboration.details && 
               typeof singleCollaboration.details === 'object' && 
               'has_token' in singleCollaboration.details && 
               singleCollaboration.details.has_token && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Coins className="h-3 w-3" /> Token
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Description</h3>
              <p className="text-sm text-gray-600">{singleCollaboration.description}</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <CalendarDays className="h-3 w-3" />
                <span>
                  {singleCollaboration.date_type === 'flexible' 
                    ? 'Flexible timing' 
                    : singleCollaboration.specific_date 
                      ? `Date: ${singleCollaboration.specific_date}` 
                      : 'Specific date (unspecified)'}
                </span>
              </div>
              
              {singleCollaboration.details && 
               typeof singleCollaboration.details === 'object' && 
               'has_compensation' in singleCollaboration.details && 
               singleCollaboration.details.has_compensation && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Coins className="h-3 w-3" />
                  <span>Paid opportunity</span>
                </div>
              )}
              
              {singleCollaboration.details && 
               typeof singleCollaboration.details === 'object' && 
               'required_min_followers' in singleCollaboration.details && 
               singleCollaboration.details.required_min_followers && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Twitter className="h-3 w-3" />
                  <span>Min {singleCollaboration.details.required_min_followers} followers</span>
                </div>
              )}
            </div>
            
            {singleCollaboration.required_company_sectors && 
             singleCollaboration.required_company_sectors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-1">Required Company Sectors</h3>
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(singleCollaboration.required_company_sectors) && 
                    singleCollaboration.required_company_sectors.map((sector, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {sector}
                      </Badge>
                    ))
                  }
                </div>
              </div>
            )}
            
            {/* Display blockchain networks in detail view if available */}
            {singleCollaboration.company_blockchain_networks && 
             singleCollaboration.company_blockchain_networks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-1">Blockchain Networks</h3>
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(singleCollaboration.company_blockchain_networks) && 
                    singleCollaboration.company_blockchain_networks.map((network, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {network}
                      </Badge>
                    ))
                  }
                </div>
              </div>
            )}
            
            {/* Additional collaboration details based on type */}
            {singleCollaboration.details && typeof singleCollaboration.details === 'object' && (
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-medium">Additional Details</h3>
                
                {/* Podcast details */}
                {'podcast_name' in singleCollaboration.details && (
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium block">Podcast Name:</span>
                      <span className="text-sm">{singleCollaboration.details.podcast_name}</span>
                    </div>
                    {'podcast_link' in singleCollaboration.details && (
                      <div>
                        <span className="text-xs font-medium block">Podcast Link:</span>
                        <a 
                          href={singleCollaboration.details.podcast_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {singleCollaboration.details.podcast_link}
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Twitter spaces details */}
                {'space_topic' in singleCollaboration.details && (
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium block">Space Topics:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Array.isArray(singleCollaboration.details.space_topic) && 
                          singleCollaboration.details.space_topic.map((topic, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))
                        }
                      </div>
                    </div>
                    {'host_follower_count' in singleCollaboration.details && (
                      <div>
                        <span className="text-xs font-medium block">Host Follower Count:</span>
                        <span className="text-sm">{singleCollaboration.details.host_follower_count}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Newsletter details */}
                {'newsletter_name' in singleCollaboration.details && (
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium block">Newsletter Name:</span>
                      <span className="text-sm">{singleCollaboration.details.newsletter_name}</span>
                    </div>
                    {'subscriber_count' in singleCollaboration.details && (
                      <div>
                        <span className="text-xs font-medium block">Subscriber Count:</span>
                        <span className="text-sm">{singleCollaboration.details.subscriber_count}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Research report details */}
                {'report_topic' in singleCollaboration.details && (
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium block">Report Topic:</span>
                      <span className="text-sm">{singleCollaboration.details.report_topic}</span>
                    </div>
                    {'estimated_reach' in singleCollaboration.details && (
                      <div>
                        <span className="text-xs font-medium block">Estimated Reach:</span>
                        <span className="text-sm">{singleCollaboration.details.estimated_reach}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Twitter co-marketing details */}
                {'comarketing_types' in singleCollaboration.details && (
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium block">Co-Marketing Types:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Array.isArray(singleCollaboration.details.comarketing_types) && 
                          singleCollaboration.details.comarketing_types.map((type, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex gap-2">
            <Button 
              onClick={() => handleApply(singleCollaboration.id)} 
              className="flex-1"
            >
              Apply
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/browse-collaborations')}
              className="flex-1"
            >
              Back to List
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };
  
  // Variable for page title and subtitle based on view mode
  const pageTitle = id ? "Collaboration Details" : "Browse Collaborations";
  const pageSubtitle = id ? "View collaboration information" : "Find collaboration opportunities";
  
  // Check if we're in single collaboration view
  const isLoading = id ? isSingleLoading : isListLoading;
  const isError = id ? isSingleError : isListError;
  
  return (
    <MobileCheck>
      <div className="min-h-[100svh] bg-background">
        <PageHeader 
          title={pageTitle}
          subtitle={pageSubtitle}
          backUrl={id ? "/browse-collaborations" : "/dashboard"}
        />
        
        <div className="p-4 space-y-4">
          {/* Only show these UI elements in list view */}
          {!id && (
            <>
              <div className="flex justify-end mb-4">
                <Button 
                  variant="default" 
                  onClick={() => setLocation('/create-collaboration')}
                  size="sm"
                >
                  Create New
                </Button>
              </div>
              
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative flex-grow">
                  <Input
                    type="text"
                    placeholder="Search collaborations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-10"
                  />
                </div>
                
                {isMobile ? (
                  <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="shrink-0">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                      <SheetHeader className="mb-5">
                        <SheetTitle>Filters</SheetTitle>
                        <SheetDescription>
                          Narrow down your collaboration search
                        </SheetDescription>
                      </SheetHeader>
                      <FilterPanel />
                    </SheetContent>
                  </Sheet>
                ) : (
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="shrink-0"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </>
          )}
          
          {/* Conditional rendering based on single or list view */}
          {id ? (
            // Single collaboration view
            isLoading ? (
              renderSkeletons()
            ) : isError ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-2">Failed to load collaboration</p>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/browse-collaborations')}
                >
                  Back to List
                </Button>
              </div>
            ) : singleCollaboration ? (
              renderSingleCollaboration()
            ) : (
              <div className="text-center py-12 border rounded-lg">
                <p className="text-gray-500 mb-4">Collaboration not found</p>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/browse-collaborations')}
                >
                  Back to List
                </Button>
              </div>
            )
          ) : (
            // List view with filters
            <div className="flex flex-col md:flex-row gap-6">
              {/* Filters - Desktop */}
              {!isMobile && isFilterOpen && (
                <div className="md:w-1/4 shrink-0">
                  <div className="sticky top-6 border rounded-lg p-4 bg-card">
                    <h2 className="text-lg font-semibold mb-4">Filters</h2>
                    <FilterPanel />
                  </div>
                </div>
              )}
              
              {/* Collaborations List */}
              <div className={`${!isMobile && isFilterOpen ? 'md:w-3/4' : 'w-full'}`}>
                {isLoading ? (
                  renderSkeletons()
                ) : isError ? (
                  <div className="text-center py-8">
                    <p className="text-red-500 mb-2">Failed to load collaborations</p>
                    <Button variant="outline" onClick={() => refetch()}>
                      Try Again
                    </Button>
                  </div>
                ) : collaborations && collaborations.length > 0 ? (
                  <div>
                    <p className="text-sm text-gray-500 mb-4">
                      Showing {collaborations.length} collaboration{collaborations.length !== 1 ? 's' : ''}
                    </p>
                    {collaborations.map(collab => renderCollaborationCard(collab))}
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <p className="text-gray-500 mb-4">No collaborations found</p>
                    <p className="text-gray-400 text-sm mb-6">
                      Try adjusting your filters or create a new collaboration
                    </p>
                    <Button 
                      onClick={() => setLocation('/create-collaboration')}
                    >
                      Create New Collaboration
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </MobileCheck>
  );
}