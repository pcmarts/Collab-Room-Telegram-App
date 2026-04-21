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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileCheck } from "@/components/MobileCheck";
import { Eyebrow } from "@/components/brand";

import {
  collabApplicationSchema,
  type Collaboration,
  type CollabApplicationData,
} from "@shared/schema";

import { CalendarDays, Coins, Tag, Check, X } from "lucide-react";

interface ApplyProps {
  id?: string;
}

export default function Apply({ id: propId }: ApplyProps = {}) {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse collab ID from URL parameters or props
  const collabId = propId || params.id;
  
  // Fetch collaboration details
  const { data: collaboration, isLoading, isError } = useQuery({
    queryKey: [`/api/collaborations/${collabId}`],
    queryFn: async () => {
      return (await apiRequest(`/api/collaborations/${collabId}`)) as Collaboration;
    },
    enabled: !!collabId
  });
  
  // Setup form
  const form = useForm<CollabApplicationData>({
    resolver: zodResolver(collabApplicationSchema),
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
  const onSubmit = async (data: CollabApplicationData) => {
    if (!collabId) return;
    
    setIsSubmitting(true);
    try {
      await apiRequest(`/api/collaborations/${collabId}/apply`, 'POST', data);

      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully!",
      });

      setLocation('/application-status');
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
          <div className="mb-8">
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-8 w-3/4" />
          </div>

          <section className="mb-8 border-b border-hairline pb-8">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
          </section>

          <section className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </section>
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
          <Button onClick={() => setLocation('/discover')}>
            Browse Collaborations
          </Button>
        </div>
      </MobileCheck>
    );
  }
  
  return (
    <MobileCheck>
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <Eyebrow className="mb-2">Apply</Eyebrow>
            <h1 className="text-2xl font-semibold tracking-tight text-text">
              Pitch this collab
            </h1>
          </div>
          <Button variant="ghost" onClick={() => setLocation(`/discover`)}>
            Back
          </Button>
        </div>
        
        <section className="mb-8 border-b border-hairline pb-8">
          <Badge className="mb-3">{collaboration.collab_type}</Badge>
          <h2 className="text-xl font-semibold tracking-tight text-text mb-4">
            {collaboration.title}
          </h2>
          <p className="text-text-muted mb-6">{collaboration.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-text-subtle" />
                <span className="text-sm text-text-muted">
                  {collaboration.date_type === 'flexible'
                    ? 'Flexible timing'
                    : collaboration.date_type === 'specific'
                      ? 'Specific date'
                      : 'Recurring'}
                </span>
              </div>

              {collaboration.company_has_token && (
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-text-subtle" />
                  <span className="text-sm text-text-muted">Has token</span>
                </div>
              )}

              {collaboration.has_compensation && (
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-text-subtle" />
                  <span className="text-sm text-text-muted">Paid opportunity</span>
                </div>
              )}
            </div>
            
            {/* Requirements */}
            {((collaboration.required_company_sectors?.length ?? 0) > 0 ||
              (collaboration.required_blockchain_networks?.length ?? 0) > 0 ||
              collaboration.min_user_followers ||
              collaboration.additional_requirements) && (
              <>
                <Eyebrow className="mb-3">Requirements</Eyebrow>
                <div className="space-y-3 mb-6">
                  {collaboration.min_user_followers && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success" />
                      <span className="text-sm text-text">
                        Minimum {collaboration.min_user_followers} Twitter followers
                      </span>
                    </div>
                  )}

                  {(collaboration.required_company_sectors?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 text-text">Required Company Sectors</p>
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

                  {(collaboration.required_blockchain_networks?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 text-text">Required Blockchain Networks</p>
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
                      <p className="text-sm font-medium mb-1 text-text">Additional Requirements</p>
                      <p className="text-sm text-text-muted">
                        {collaboration.additional_requirements}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {collaboration.has_compensation && collaboration.compensation_details && (
              <>
                <Eyebrow className="mb-2">Compensation</Eyebrow>
                <p className="text-sm text-text-muted">
                  {collaboration.compensation_details}
                </p>
              </>
            )}
        </section>

        <section>
          <div className="mb-6">
            <Eyebrow className="mb-2">Application</Eyebrow>
            <h2 className="text-xl font-semibold tracking-tight text-text">
              Your pitch
            </h2>
          </div>
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
                    onClick={() => setLocation('/discover')}
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
        </section>
      </div>
    </MobileCheck>
  );
}