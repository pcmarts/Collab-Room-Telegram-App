import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User } from '@shared/schema';

interface ProfileResponse {
  user: User;
  company: any;
  preferences: any;
}

export function MatchingToggle() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: profile } = useQuery<ProfileResponse>({
    queryKey: ['/api/profile'],
  });

  const toggleMatching = async (enabled: boolean) => {
    try {
      setIsUpdating(true);
      const response = await apiRequest('POST', '/api/preferences/matching', { enabled });

      if (!response.ok) {
        throw new Error('Failed to update matching preferences');
      }

      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });

      toast({
        title: 'Success!',
        description: `Collaboration matching ${enabled ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update matching preferences.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center space-x-4 p-4 rounded-lg bg-card">
      <div className="flex-1">
        <h3 className="font-medium">Collaboration Matching</h3>
        <p className="text-sm text-muted-foreground">
          {profile?.user?.matching_enabled 
            ? "You'll receive notifications for new collaboration matches" 
            : "You won't receive new match notifications"}
        </p>
      </div>
      <Switch
        checked={profile?.user?.matching_enabled ?? false}
        onCheckedChange={toggleMatching}
        disabled={isUpdating}
      />
    </div>
  );
}