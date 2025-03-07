import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileCheck } from "@/components/MobileCheck";

import {
  applicationSchema,
  type Collaboration,
  type ApplicationData,
} from "@shared/schema";

import { CalendarDays, Coins, Tag, Check, X } from "lucide-react";

export default function Apply() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse collab ID from URL parameters
  const collabId = params.id;
  
  // Fetch collaboration details
  const { data: collaboration, isLoading, isError } = useQuery({
    queryKey: [`/api/collaborations/${collabId}`],
    queryFn: async () => {
      const response = await apiRequest(`/api/collaborations/${collabId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch collaboration details");
      }
      return response.json() as Promise<Collaboration>;
    },
    enabled: !!collabId
  });
  
  // Setup form
  const form = useForm<ApplicationData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      reason: "",
      experience: "",
      portfolioLinks: "",
      twitterHandle: "",
      githubHandle: "",
      notes: ""
    }
  });
  
  // Handle form submission
  const onSubmit = async (data: ApplicationData) => {
    if (!collabId) return;
    
    setIsSubmitting(true);
    try {
      const response = await apiRequest(`/api/collaborations/${collabId}/apply`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Show success message
        toast({
          title: "Application Submitted",
          description: "Your application has been submitted successfully!",
        });
        
        // Redirect to application status page
        setLocation('/application-status');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit application');
      }
    } catch (error) {
      // Show error message
      toast({
        title: "Application Failed",
        description: error instanceof Error ? error.message : "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <MobileCheck>
        <div className="container mx-auto py-6 px-4 max-w-4xl">
          <div className="mb-6">
            <Skeleton className="h-10 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          
          <Card className="mb-8">
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-8 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-8 w-full mb-6" />
              <Skeleton className="h-24 w-full mb-6" />
              <Skeleton className="h-24 w-full mb-6" />
              <Skeleton className="h-8 w-full mb-6" />
              <Skeleton className="h-8 w-full mb-6" />
            </CardContent>
          </Card>
        </div>
      </MobileCheck>
    );
  }
  
  if (isError || !collaboration) {
    return (
      <MobileCheck>
        <div className="container mx-auto py-6 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Collaboration Not Found</h1>
          <p className="mb-6">The collaboration you're looking for doesn't exist or couldn't be loaded.</p>
          <Button onClick={() => setLocation('/browse-collaborations')}>
            Browse Collaborations
          </Button>
        </div>
      </MobileCheck>
    );
  }
  
  return (
    <MobileCheck>
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Apply for Collaboration</h1>
          <Button variant="ghost" onClick={() => setLocation(`/browse-collaborations`)}>
            Back
          </Button>
        </div>
        
        {/* Collaboration Details */}
        <Card className="mb-8">
          <CardHeader>
            <Badge className="mb-2">{collaboration.collab_type}</Badge>
            <CardTitle className="text-xl">{collaboration.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">{collaboration.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {collaboration.date_type === 'flexible' 
                    ? 'Flexible timing' 
                    : collaboration.date_type === 'specific' 
                      ? 'Specific date' 
                      : 'Recurring'}
                </span>
              </div>
              
              {collaboration.has_token && (
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Has token</span>
                </div>
              )}
              
              {collaboration.has_compensation && (
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Paid opportunity</span>
                </div>
              )}
            </div>
            
            {/* Requirements */}
            {(collaboration.required_company_sectors?.length > 0 || 
              collaboration.required_blockchain_networks?.length > 0 || 
              collaboration.required_min_followers || 
              collaboration.additional_requirements) && (
              <>
                <h3 className="font-medium mb-3">Requirements</h3>
                <div className="space-y-3 mb-6">
                  {collaboration.required_min_followers && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        Minimum {collaboration.required_min_followers} Twitter followers
                      </span>
                    </div>
                  )}
                  
                  {collaboration.required_company_sectors?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Required Company Sectors:</p>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(collaboration.required_company_sectors) && 
                          collaboration.required_company_sectors.map((sector, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {sector}
                            </Badge>
                          ))
                        }
                      </div>
                    </div>
                  )}
                  
                  {collaboration.required_blockchain_networks?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Required Blockchain Networks:</p>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(collaboration.required_blockchain_networks) && 
                          collaboration.required_blockchain_networks.map((network, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {network}
                            </Badge>
                          ))
                        }
                      </div>
                    </div>
                  )}
                  
                  {collaboration.additional_requirements && (
                    <div>
                      <p className="text-sm font-medium mb-1">Additional Requirements:</p>
                      <p className="text-sm text-gray-600">
                        {collaboration.additional_requirements}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {/* Compensation Details */}
            {collaboration.has_compensation && collaboration.compensation_details && (
              <>
                <h3 className="font-medium mb-2">Compensation Details</h3>
                <p className="text-sm text-gray-600 mb-6">
                  {collaboration.compensation_details}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle>Your Application</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Why are you interested in this collaboration?</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Explain why you're interested in this collaboration and what you hope to gain from it."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relevant Experience</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your experience relevant to this collaboration."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="portfolioLinks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Portfolio Links</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Share links to your portfolio, past projects, or work examples (one per line)."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Add one link per line. Include any relevant samples of your work.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="twitterHandle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter Handle</FormLabel>
                        <FormControl>
                          <Input placeholder="@yourhandle" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="githubHandle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GitHub Handle (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="@username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional information you'd like to share with the collaboration creator."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-4 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setLocation('/browse-collaborations')}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </MobileCheck>
  );
}