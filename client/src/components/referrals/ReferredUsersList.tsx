import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ShareIcon, UsersIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ReferredUser {
  id: string;
  first_name: string;
  last_name: string | null;
  handle: string;
  created_at: string;
}

interface ReferredUsersListProps {
  users: ReferredUser[];
  isLoading: boolean;
}

const ReferredUsersList = ({ users, isLoading }: ReferredUsersListProps) => {

  // Helper function to get user initials for avatar
  const getUserInitials = (firstName: string, lastName: string | null) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${first}${last}`;
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Unknown date';
    }
  };

  // Render loading skeleton
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // If there are no referred users, return a simplified empty state
  if (users.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Referred Friends</CardTitle>
          <CardDescription>
            Track friends you've invited to The Collab Room
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 px-4">
            <div className="mx-auto w-16 h-16 bg-muted/70 rounded-full flex items-center justify-center mb-4">
              <UsersIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No referrals yet</h3>
            <p className="text-muted-foreground mb-6">
              Your referred friends will appear here after they join using your referral link.
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              data-share-button
            >
              <ShareIcon className="h-4 w-4 mr-2" />
              Share Your Referral Link
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Referred Friends</CardTitle>
        <CardDescription>
          Friends you have invited to The Collab Room
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="flex items-center space-x-4">
            <Avatar>
              <AvatarFallback>
                {getUserInitials(user.first_name, user.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {user.first_name} {user.last_name}
                </p>
                <Badge variant="outline" className="text-xs">
                  {formatDate(user.created_at)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">@{user.handle}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export { ReferredUsersList };
export default ReferredUsersList;