import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import type { ProfileData } from '@/types/profile';
import { format } from 'date-fns';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { FileCheck, Loader2, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ApplicationStatus() {
  const queryClient = useQueryClient();
  const [_, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(30);
  const [showReload, setShowReload] = useState(false);
  const [processingState, setProcessingState] = useState('initializing');

  // Configure query with retries and immediate refetch
  const { data: profile, isLoading, isError, refetch } = useQuery<ProfileData>({
    queryKey: ['/api/profile'],
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 5,
    retryDelay: 2000,
    staleTime: 0,
    gcTime: 0
  });

  // Effect to refetch data with exponential backoff strategy
  useEffect(() => {
    // Invalidate and refetch when component mounts
    queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
    console.log('Fetching profile data...');

    let attempts = 0;
    const maxAttempts = 10; // Reduced from 30 to avoid excessive polling
    let timeoutId: NodeJS.Timeout | null = null;

    // Calculate delay with exponential backoff
    const getBackoffDelay = (attempt: number) => {
      // Start at 1s, double each time, cap at 30s: 1, 2, 4, 8, 16, 30, 30...
      return Math.min(1000 * Math.pow(2, attempt), 30000);
    };

    // Update processing state message based on attempts
    const updateProcessingState = (attempt: number) => {
      if (attempt < 3) {
        setProcessingState('initializing');
      } else if (attempt < 6) {
        setProcessingState('processing');
      } else {
        setProcessingState('finalizing');
      }
    };

    // Function to check status with exponential backoff
    const checkStatus = () => {
      if (!profile?.user) {
        console.log(`Checking profile status, attempt ${attempts + 1}`);
        updateProcessingState(attempts);
        refetch();
        
        attempts++;
        setCountdown(maxAttempts - attempts);
        
        if (attempts >= maxAttempts) {
          setShowReload(true);
          console.log('Max attempts reached, showing reload option');
        } else {
          // Schedule next check with exponential backoff
          const nextDelay = getBackoffDelay(attempts);
          console.log(`Next check in ${nextDelay/1000} seconds`);
          timeoutId = setTimeout(checkStatus, nextDelay);
        }
      } else {
        console.log('Profile data found:', profile);
        setShowReload(false);
      }
    };
    
    // Start the first check
    checkStatus();
    
    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [queryClient, refetch, profile]);

  const getProcessingMessage = () => {
    switch (processingState) {
      case 'initializing':
        return 'Initializing your application...';
      case 'processing':
        return 'Processing your application data...';
      case 'finalizing':
        return 'Finalizing your application status...';
      default:
        return 'Loading your application status...';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100svh] bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">{getProcessingMessage()}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Please wait {countdown} seconds while we process your application
        </p>
      </div>
    );
  }

  if (isError || showReload) {
    return (
      <div className="p-4 text-center min-h-[100svh] flex flex-col items-center justify-center bg-background">
        <h1 className="text-2xl font-bold mb-4">Still Processing Application</h1>
        <p className="text-muted-foreground mb-4">
          {isError 
            ? "We're having trouble loading your application status."
            : "We're still processing your application submission. Please try again."}
        </p>
        <Button 
          onClick={() => {
            setShowReload(false);
            setCountdown(10); // Match the new maxAttempts value
            setProcessingState('initializing');
            refetch();
          }}
          className="flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!profile?.user) {
    return (
      <div className="p-4 text-center min-h-[100svh] flex flex-col items-center justify-center bg-background">
        <h1 className="text-2xl font-bold mb-4">Processing Application</h1>
        <p className="text-muted-foreground mb-4">
          {getProcessingMessage()}
        </p>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { user, company } = profile;
  const applicationDate = user.applied_at ? format(new Date(user.applied_at), 'MMMM d, yyyy') : 'Unknown';

  return (
    <div className="min-h-[100svh] bg-background">
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-10 px-4 py-3">
        <h1 className="text-lg font-semibold">Application Status</h1>
      </div>

      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileCheck className="h-8 w-8 text-primary" />
            </div>

            <h2 className="text-xl font-semibold mb-2">Application Under Review</h2>
            <p className="text-muted-foreground mb-6">
              Thanks for applying to join CollabRoom! We're reviewing your application and will notify you through Telegram once it's approved.
            </p>

            <div className="text-sm text-left space-y-3 border-t pt-6">
              <p><strong>Name:</strong> {user.first_name} {user.last_name}</p>
              <p><strong>Company:</strong> {company?.name}</p>
              <p><strong>Role:</strong> {company?.job_title}</p>
              <p><strong>Telegram:</strong> @{user.handle}</p>
              <p><strong>Applied:</strong> {applicationDate}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}