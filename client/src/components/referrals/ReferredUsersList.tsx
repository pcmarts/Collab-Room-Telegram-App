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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Referred Friends</CardTitle>
        <CardDescription>
          {users.length > 0
            ? 'Friends you have invited to Collab Room'
            : 'You haven\'t referred anyone yet'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {users.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Share your referral code to invite friends
          </div>
        ) : (
          users.map((user) => (
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
          ))
        )}
      </CardContent>
    </Card>
  );
};

export { ReferredUsersList };
export default ReferredUsersList;