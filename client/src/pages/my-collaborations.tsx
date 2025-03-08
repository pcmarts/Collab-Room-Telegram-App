import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MobileCheck } from "@/components/MobileCheck";
import { PageHeader } from "@/components/layout/PageHeader";

import { 
  type Collaboration, 
  type CollabApplication, 
  type ApplicationData 
} from "@shared/schema";

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
  ListChecks
} from "lucide-react";

export default function MyCollaborations() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Active tab state
  const [activeTab, setActiveTab] = useState("my-collabs");
  
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
      console.log("Fetching collaborations...");
      const response = await apiRequest('GET', '/api/collaborations/my');
      console.log("Collaborations API response status:", response.status);
      if (!response.ok) {
        throw new Error("Failed to fetch collaborations");
      }
      const data = await response.json();
      console.log("Collaborations API response data:", data);
      return data as Collaboration[];
    }
  });
  
  // Fetch user's applications
  const { data: applications, isLoading: isLoadingApps } = useQuery({
    queryKey: ['/api/my-applications'],
    queryFn: async () => {
      console.log("Fetching applications...");
      const response = await apiRequest('GET', '/api/my-applications');
      console.log("Applications API response status:", response.status);
      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }
      const data = await response.json();
      console.log("Applications API response data:", data);
      return data as CollabApplication[];
    }
  });
  
  // Handle approving an application
  const handleApproveApplication = async (applicationId: string) => {
    setProcessingApplicationId(applicationId);
    try {
      const requestOptions = {
        method: 'PATCH',
        body: JSON.stringify({ 
          status: 'approved',
          message: feedbackMessage 
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const response = await apiRequest(
        `/api/collaborations/applications/${applicationId}`, 
        requestOptions as any
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
      const requestOptions = {
        method: 'PATCH',
        body: JSON.stringify({ 
          status: 'rejected',
          message: feedbackMessage 
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const response = await apiRequest(
        `/api/collaborations/applications/${applicationId}`, 
        requestOptions as any
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
  
  // Render a collaboration card
  const renderCollaborationCard = (collab: Collaboration) => {
    // Check if there are any pending applications
    const pendingApplications = collab.applications?.filter(app => app.status === 'pending') || [];
    const hasApplications = pendingApplications.length > 0;
    
    return (
      <Card key={collab.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <Badge className="mb-2">{collab.collab_type}</Badge>
              <CardTitle className="text-xl">{collab.title}</CardTitle>
            </div>
            {hasApplications && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {pendingApplications.length} application{pendingApplications.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">{collab.description}</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <CalendarDays className="h-3 w-3" />
              <span>{collab.date_type === 'flexible' ? 'Flexible timing' : 'Specific date'}</span>
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
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => setLocation(`/collaboration/${collab.id}`)}
              >
                <Eye className="h-4 w-4 mr-1" /> 
                View
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
        <PageHeader
          title="My Collaborations"
          backUrl="/dashboard"
        />
        
        <div className="container mx-auto py-4 px-4">
          <div className="flex justify-end mb-4">
            <Button 
              variant="default" 
              onClick={() => setLocation('/create-collaboration')}
            >
              Create New
            </Button>
          </div>
          
          <Tabs 
            defaultValue="my-collabs" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="my-collabs">My Collaborations</TabsTrigger>
              <TabsTrigger value="my-applications">My Applications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="my-collabs" className="mt-0">
              {isLoadingCollabs ? (
                renderSkeletons()
              ) : collaborations && collaborations.length > 0 ? (
                <div>
                  {collaborations.map(collab => renderCollaborationCard(collab))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg">
                  <p className="text-gray-500 mb-4">You haven't created any collaborations yet</p>
                  <p className="text-gray-400 text-sm mb-6">
                    Create your first collaboration to connect with others in the blockchain space
                  </p>
                  <Button 
                    onClick={() => setLocation('/create-collaboration')}
                  >
                    Create Collaboration
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="my-applications" className="mt-0">
              {isLoadingApps ? (
                renderSkeletons()
              ) : applications && applications.length > 0 ? (
                <div>
                  {applications.map(app => renderApplicationCard(app))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg">
                  <p className="text-gray-500 mb-4">You haven't applied to any collaborations yet</p>
                  <p className="text-gray-400 text-sm mb-6">
                    Browse available collaborations and apply to ones that interest you
                  </p>
                  <Button 
                    onClick={() => setLocation('/browse-collaborations')}
                  >
                    Browse Collaborations
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
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
      </div>
    </MobileCheck>
  );
}