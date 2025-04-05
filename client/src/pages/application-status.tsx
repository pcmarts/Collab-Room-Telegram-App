import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Clock, AlertTriangle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StatusUpdate {
  status: string;
  message: string;
  timestamp: string;
}

interface ProfileData {
  user: {
    id: string;
    is_approved: boolean;
    // include other user properties as needed
  };
  company?: any;
  preferences?: any;
  marketingPreferences?: any;
  conferencePreferences?: any;
}

export default function ApplicationStatusPage() {
  const { toast } = useToast();
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [connectionActive, setConnectionActive] = useState<boolean>(false);
  
  // Fetch current user profile to get the user ID
  const { data: profile, isLoading: isLoadingProfile, error: profileError } = useQuery<ProfileData>({
    queryKey: ['/api/profile'],
    refetchOnWindowFocus: false,
  });
  
  useEffect(() => {
    if (!profile?.user?.id) return;
    
    const userId = profile.user.id;
    let eventSource: EventSource | null = null;
    
    // Create SSE connection
    try {
      eventSource = new EventSource(`/api/application-status-updates/${userId}`);
      
      eventSource.onopen = () => {
        console.log('SSE connection established');
        setConnectionActive(true);
      };
      
      // Handle status update events
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Status update received:', data);
        
        // Add new status update to the list
        setStatusUpdates(prev => [data, ...prev]);
        
        // Show toast notification for new updates
        toast({
          title: 'Application Status Update',
          description: data.message,
          variant: data.status === 'approved' ? 'default' : 'destructive',
        });
        
        // If status is final or connection is closing, close the connection
        if (data.status === 'connection_closing') {
          eventSource?.close();
          setConnectionActive(false);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setConnectionActive(false);
        eventSource?.close();
      };
    } catch (error) {
      console.error('Failed to establish SSE connection:', error);
      setConnectionActive(false);
    }
    
    // Clean up on component unmount
    return () => {
      if (eventSource) {
        console.log('Cleaning up SSE connection');
        eventSource.close();
        setConnectionActive(false);
      }
    };
  }, [profile?.user?.id, toast]);
  
  // Get the current status from the latest update or the profile
  const currentStatus = statusUpdates.length > 0 
    ? statusUpdates[0].status 
    : profile?.user?.is_approved 
      ? 'approved' 
      : 'processing';
  
  // Loading state
  if (isLoadingProfile) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Error state
  if (profileError) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <Card className="border-red-300">
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center">
              <AlertCircle className="mr-2" /> Error Loading Application Status
            </CardTitle>
            <CardDescription>
              We couldn't load your application status. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              If this problem persists, please contact support.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card className={`mb-6 ${
        currentStatus === 'approved' ? 'border-green-300' : 
        currentStatus === 'rejected' ? 'border-red-300' : 'border-yellow-300'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center">
            {currentStatus === 'approved' ? (
              <><CheckCircle className="text-green-500 mr-2" /> Application Approved</>
            ) : currentStatus === 'rejected' ? (
              <><AlertTriangle className="text-red-500 mr-2" /> Application Rejected</>
            ) : (
              <><Clock className="text-yellow-500 mr-2" /> Application Processing</>
            )}
          </CardTitle>
          <CardDescription>
            {connectionActive ? 'Receiving real-time status updates...' : 'Status updates paused.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Current Status</h3>
              <p className="text-sm mb-1">
                {statusUpdates.length > 0 ? statusUpdates[0].message : 
                  profile?.user?.is_approved 
                    ? 'Your application has been approved! You can now access all platform features.'
                    : 'Your application is currently being processed...'}
              </p>
              <p className="text-xs text-gray-500">
                Last updated: {statusUpdates.length > 0 
                  ? new Date(statusUpdates[0].timestamp).toLocaleString()
                  : 'Initial status'}
              </p>
            </div>
            
            {statusUpdates.length > 1 && (
              <div>
                <h3 className="font-medium mb-2">Update History</h3>
                <div className="space-y-3">
                  {statusUpdates.slice(1).map((update, index) => (
                    <div key={index} className="border-l-2 pl-3 py-1 border-gray-300">
                      <p className="text-sm">{update.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(update.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {currentStatus === 'approved' && (
              <div className="bg-green-50 p-4 rounded-md">
                <h3 className="font-medium text-green-700 mb-2">What's Next?</h3>
                <p className="text-sm mb-3">
                  Your application has been approved! You can now access all platform features:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 mb-3">
                  <li>Create and manage collaborations</li>
                  <li>Browse the marketplace for opportunities</li>
                  <li>Apply to others' collaborations</li>
                  <li>Set up your detailed preferences</li>
                </ul>
                <Button asChild className="mt-2">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        {currentStatus !== 'approved' && (
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
            <Button onClick={() => window.location.reload()}>Refresh Status</Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}