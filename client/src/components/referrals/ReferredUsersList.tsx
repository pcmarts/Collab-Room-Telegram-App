import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/brand';
import { ShareIcon } from 'lucide-react';
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
      <section className="rounded-lg border border-hairline bg-surface p-5">
        <Skeleton className="mb-3 h-3 w-20" />
        <Skeleton className="mb-4 h-5 w-32" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 border-t border-hairline py-3 first:border-t-0">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </section>
    );
  }

  // If there are no referred users, return a simplified empty state
  if (users.length === 0) {
    return (
      <section className="rounded-lg border border-hairline bg-surface p-6 text-center">
        <Eyebrow>Referred</Eyebrow>
        <h3 className="mt-2 text-lg font-semibold tracking-tight text-text">
          No one yet.
        </h3>
        <p className="mt-1 text-sm text-text-muted">
          Friends who join via your code will land here.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          data-share-button
        >
          <ShareIcon className="h-4 w-4" />
          Share your link
        </Button>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-hairline bg-surface p-5">
      <Eyebrow tone="brand">Referred</Eyebrow>
      <h3 className="mt-1 text-lg font-semibold tracking-tight text-text">
        Friends you've invited
      </h3>

      <div className="mt-4 divide-y divide-hairline">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3 py-3">
            <Avatar>
              <AvatarFallback>
                {getUserInitials(user.first_name, user.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-medium text-text">
                  {user.first_name} {user.last_name}
                </p>
                <span className="shrink-0 text-xs tabular text-text-subtle">
                  {formatDate(user.created_at)}
                </span>
              </div>
              <p className="text-xs text-text-muted">@{user.handle}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export { ReferredUsersList };
export default ReferredUsersList;