import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Calendar, Building2, AtSign } from 'lucide-react';

// Define expanded User interface for this component
interface User {
  id: string;
  telegram_id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  handle?: string;
  is_admin: boolean;
  is_approved: boolean;
  applied_at: string;
  linkedin_url?: string;
  twitter_url?: string;
  twitter_followers?: string;
  // Add any other relevant fields
}

export default function AdminUsers() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [, setLocation] = useLocation();

  // Check if current user is admin
  const { data: currentUserData, isLoading: checkingAdmin } = useQuery({
    queryKey: ['/api/profile']
  });

  // Effect to handle admin status update
  React.useEffect(() => {
    if (currentUserData?.user?.is_admin) {
      setIsAdmin(true);
    }
  }, [currentUserData]);

  // Fetch all users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: isAdmin,
    retry: false
  });

  // Mutation for approving a user
  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('/api/admin/approve-user', 'POST', {
        userId
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Success",
        description: "User has been approved"
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve user"
      });
    }
  });

  // Filter for unapproved users
  const pendingUsers = users.filter(user => !user.is_approved);

  if (checkingAdmin) {
    return (
      <div className="container mx-auto py-6 px-4">
        <PageHeader title="Pending Applications" backUrl="/dashboard" />
        <div className="mt-8">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-6 px-4">
        <PageHeader title="Pending Applications" backUrl="/dashboard" />
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <PageHeader title="Pending Applications" backUrl="/dashboard" />

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Review Applications</CardTitle>
            <CardDescription>
              Review and approve new user applications. {pendingUsers.length} pending applications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading applications...</div>
            ) : (
              <div className="space-y-6">
                {pendingUsers.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground">
                    No pending applications
                  </div>
                ) : (
                  pendingUsers.map((user: User) => (
                    <Card key={user.id} className="p-4">
                      <div className="space-y-4">
                        {/* User Basic Info */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {user.first_name} {user.last_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              @{user.handle || 'No handle'}
                            </p>
                          </div>
                          <Button
                            onClick={() => approveUserMutation.mutate(user.id)}
                            disabled={approveUserMutation.isPending}
                          >
                            Approve Application
                          </Button>
                        </div>

                        {/* Contact & Social */}
                        <div className="grid gap-2 text-sm">
                          {user.email && (
                            <div className="flex items-center gap-2">
                              <AtSign className="h-4 w-4" />
                              <span>{user.email}</span>
                            </div>
                          )}
                          {user.linkedin_url && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" 
                                 className="text-primary hover:underline">
                                LinkedIn Profile
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Twitter Info */}
                        {user.twitter_url && (
                          <div className="text-sm">
                            <a href={user.twitter_url} target="_blank" rel="noopener noreferrer" 
                               className="text-primary hover:underline">
                              Twitter Profile
                            </a>
                            {user.twitter_followers && (
                              <span className="ml-2 text-muted-foreground">
                                ({user.twitter_followers} followers)
                              </span>
                            )}
                          </div>
                        )}

                        {/* Application Date */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Applied on {new Date(user.applied_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}