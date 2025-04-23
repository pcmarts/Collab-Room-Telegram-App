import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { useEffect } from 'react';

interface ReferredUser {
  id: string;
  first_name: string;
  last_name: string | null;
  handle: string;
  created_at: string;
}

interface ReferredUsersListProps {
  className?: string;
  users?: ReferredUser[];
  isLoading?: boolean;
}

// Function to log analytics events
const logAnalyticsEvent = async (eventType: 'generate' | 'share' | 'copy' | 'view', details?: Record<string, any>) => {
  try {
    await fetch('/api/referrals/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventType,
        details
      })
    });
    console.log(`Logged referral ${eventType} event`);
  } catch (err) {
    console.error(`Failed to log referral ${eventType} event:`, err);
  }
};

export function ReferredUsersList({ className = '', users = [], isLoading = false }: ReferredUsersListProps) {
  // Log view event when component mounts
  useEffect(() => {
    if (!isLoading && users) {
      logAnalyticsEvent('view', {
        component: 'ReferredUsersList',
        num_users: users.length
      });
    }
  }, [isLoading, users]);
  if (isLoading) {
    return (
      <Card className={`bg-gray-950 text-white border-gray-800 ${className}`}>
        <CardHeader>
          <Skeleton className="h-8 w-1/2 mb-2 bg-gray-800" />
          <Skeleton className="h-4 w-1/3 bg-gray-800" />
        </CardHeader>
        <CardContent>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center py-3 border-b border-gray-800 last:border-0">
              <Skeleton className="h-10 w-10 rounded-full mr-3 bg-gray-800" />
              <div className="flex-1">
                <Skeleton className="h-4 w-1/3 mb-2 bg-gray-800" />
                <Skeleton className="h-3 w-1/4 bg-gray-800" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={`bg-gray-950 text-white border-gray-800 ${className}`}>
      <CardHeader>
        <CardTitle>Your Invited Friends</CardTitle>
        <CardDescription className="text-gray-400">
          {users.length > 0 
            ? `${users.length} user${users.length > 1 ? 's' : ''} joined with your referral link`
            : 'No one has used your referral link yet'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center text-center text-gray-500">
            <Users className="h-12 w-12 mb-4 text-gray-700" />
            <p className="mb-1 text-gray-400">No friends have joined yet</p>
            <p className="text-sm text-gray-600">Share your referral link to invite friends to The Collab Room</p>
          </div>
        ) : (
          <div className="space-y-1">
            {users.map((user) => (
              <div key={user.id} className="flex items-center py-3 border-b border-gray-800 last:border-0">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarFallback className="bg-gray-800 text-gray-300">
                    {user.first_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-white">
                    {user.first_name} {user.last_name || ''}
                  </p>
                  <p className="text-sm text-gray-400">@{user.handle}</p>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}