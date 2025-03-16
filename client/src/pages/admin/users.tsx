import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';

// Define minimal User interface for this component
interface User {
  id: string;
  telegram_id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  handle?: string;
  is_admin: boolean;
}

export default function AdminUsers() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [, setLocation] = useLocation();

  // Define interface for profile data
  interface ProfileData {
    user: {
      id: string;
      name?: string;
      is_admin: boolean;
    };
  }

  // Check if current user is admin
  const { data: currentUserData, isLoading: checkingAdmin } = useQuery<ProfileData>({
    queryKey: ['/api/profile']
  });

  // Effect to handle admin status update
  useEffect(() => {
    if (currentUserData?.user?.is_admin) {
      setIsAdmin(true);
    }
  }, [currentUserData]);

  // Fetch all users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: isAdmin
  });

  // Mutation for toggling admin status
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string, isAdmin: boolean }) => {
      return apiRequest(`/api/admin/users/${userId}/admin-status`, "PATCH", {
        isAdmin,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'Admin status updated',
        description: 'User admin status has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update admin status"
      });
    },
  });

  // Mutation for starting impersonation
  const startImpersonationMutation = useMutation({
    mutationFn: async (telegram_id: string) => {
      return apiRequest('/api/admin/impersonate', "POST", {
        telegram_id
      });
    },
    onSuccess: () => {
      toast({
        title: "Impersonation Started",
        description: "You are now viewing the application as the selected user"
      });
      // Redirect to dashboard after impersonation starts
      setLocation('/dashboard');
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start impersonation"
      });
    }
  });

  const handleToggleAdmin = (userId: string, currentAdminStatus: boolean) => {
    toggleAdminMutation.mutate({
      userId,
      isAdmin: !currentAdminStatus,
    });
  };

  const handleImpersonate = (telegram_id: string) => {
    startImpersonationMutation.mutate(telegram_id);
  };

  if (checkingAdmin) {
    return (
      <div className="container mx-auto py-6">
        <PageHeader title="Admin - Users" backUrl="/dashboard" />
        <div className="mt-8">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-6">
        <PageHeader title="Admin - Users" backUrl="/dashboard" />
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access this page. Only administrators can manage users.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <PageHeader title="Admin - Users" backUrl="/dashboard" />

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Manage Users</CardTitle>
            <CardDescription>
              View and manage all users registered in the platform. Toggle admin permissions and impersonate users as needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading users...</div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-4 font-semibold py-2 border-b">
                  <div>Username</div>
                  <div>Email/Telegram</div>
                  <div>Admin</div>
                  <div>Actions</div>
                </div>
                {users?.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground">
                    No users found
                  </div>
                ) : (
                  users?.map((user: User) => (
                    <div key={user.id} className="grid grid-cols-4 py-2 border-b items-center">
                      <div>{user.first_name} {user.last_name}</div>
                      <div>
                        {user.email || 'No email'} 
                        <div className="text-sm text-muted-foreground">
                          Telegram ID: {user.telegram_id}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={user.is_admin} 
                          onCheckedChange={() => handleToggleAdmin(user.id, user.is_admin)}
                          disabled={toggleAdminMutation.isPending}
                        />
                        <Label htmlFor={`admin-${user.id}`}>
                          {user.is_admin ? 'Admin' : 'User'}
                        </Label>
                      </div>
                      <div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleImpersonate(user.telegram_id)}
                          disabled={startImpersonationMutation.isPending}
                        >
                          Impersonate
                        </Button>
                      </div>
                    </div>
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